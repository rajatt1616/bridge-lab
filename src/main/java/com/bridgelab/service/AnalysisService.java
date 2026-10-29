package com.bridgelab.service;

import com.bridgelab.dto.*;
import com.bridgelab.mapper.BridgeMapper;
import com.bridgelab.model.Beam;
import com.bridgelab.model.Member;
import com.bridgelab.solver.AnalysisResult;
import com.bridgelab.solver.MethodOfJointsSolver;
import com.bridgelab.solver.SingularMatrixException;
import com.bridgelab.solver.UnstableStructureException;

import java.util.*;

public class AnalysisService {
    private static final String AGGREGATE_ID = "BRIDGE";

    public AnalysisResponse analyze(AnalysisRequest request) {
        List<JointDto> joints = safeList(request == null ? null : request.joints());
        List<BeamDto> beams = safeList(request == null ? null : request.beams());
        List<SupportDto> supports = safeList(request == null ? null : request.supports());
        List<LoadDto> loads = safeList(request == null ? null : request.loads());

        if (joints.isEmpty()) {
            return unstable("Add joints, beams, and at least two supports (one pinned).", 0, 0);
        }

        Map<String, JointDto> jointById = new LinkedHashMap<>();
        for (JointDto joint : joints) {
            if (joint == null || isBlank(joint.id())) {
                return invalid("Every joint must have an id.", 0, 0);
            }
            if (jointById.putIfAbsent(joint.id(), joint) != null) {
                return invalid("Duplicate joint id: " + joint.id(), 0, 0);
            }
        }

        double totalLoad = 0;
        for (LoadDto load : loads) {
            if (load == null || isBlank(load.joint()) || !jointById.containsKey(load.joint())) {
                return invalid("A load references an unknown joint.", 0, totalLoad);
            }
            totalLoad += Math.hypot(load.fx(), load.fy());
        }

        Map<String, Set<String>> adjacency = new LinkedHashMap<>();
        for (String jointId : jointById.keySet()) {
            adjacency.put(jointId, new LinkedHashSet<>());
        }

        double totalLength = 0;
        List<BeamDto> validBeams = new ArrayList<>();
        for (BeamDto beam : beams) {
            if (beam == null) {
                continue;
            }
            if (isBlank(beam.from()) || isBlank(beam.to())
                    || !jointById.containsKey(beam.from()) || !jointById.containsKey(beam.to())) {
                return invalid("Beam " + displayId(beam.id()) + " references an unknown joint.", totalLength, totalLoad);
            }
            if (beam.from().equals(beam.to())) {
                return invalid("Beam " + displayId(beam.id()) + " has identical endpoints.", totalLength, totalLoad);
            }
            validBeams.add(beam);
            adjacency.get(beam.from()).add(beam.to());
            adjacency.get(beam.to()).add(beam.from());
            totalLength += distance(jointById.get(beam.from()), jointById.get(beam.to()));
        }

        Map<String, String> supportByJoint = new LinkedHashMap<>();
        for (SupportDto support : supports) {
            if (support == null || isBlank(support.joint()) || !jointById.containsKey(support.joint())) {
                return invalid("A support references an unknown joint.", totalLength, totalLoad);
            }
            String type = support.type() == null ? "" : support.type().trim().toUpperCase(Locale.ROOT);
            if (!type.equals("PINNED") && !type.equals("ROLLER")) {
                return invalid("Unsupported support type: " + displayId(support.type()), totalLength, totalLoad);
            }
            supportByJoint.put(support.joint(), type);
        }

        if (validBeams.isEmpty()) {
            return unstable("Add at least one beam to form a load path.", totalLength, totalLoad);
        }
        if (supportByJoint.size() < 2) {
            return unstable("Add at least two supports, with at least one pinned support.", totalLength, totalLoad);
        }

        Set<String> component = resolveComponent(adjacency, supportByJoint, loads);
        if (component.isEmpty()) {
            return unstable("The bridge has no connected load-bearing path.", totalLength, totalLoad);
        }

        for (LoadDto load : loads) {
            if (!component.contains(load.joint())) {
                return unstable("Loads are attached to disconnected parts of the bridge.", totalLength, totalLoad);
            }
        }
        if (loads.isEmpty()) {
            for (String supportJoint : supportByJoint.keySet()) {
                if (!component.contains(supportJoint)) {
                    return unstable("Supports are attached to disconnected parts of the bridge.", totalLength, totalLoad);
                }
            }
        }

        int componentJoints = component.size();
        int componentMembers = 0;
        for (BeamDto beam : validBeams) {
            if (component.contains(beam.from()) && component.contains(beam.to())) {
                componentMembers++;
            }
        }

        int componentSupports = 0;
        int reactions = 0;
        boolean hasPinned = false;
        for (Map.Entry<String, String> support : supportByJoint.entrySet()) {
            if (!component.contains(support.getKey())) {
                continue;
            }
            componentSupports++;
            reactions += reactionCount(support.getValue());
            hasPinned = hasPinned || "PINNED".equals(support.getValue());
        }

        if (componentSupports == 0) {
            return unstable("The loaded part of the bridge is not connected to a support.", totalLength, totalLoad);
        }
        if (componentSupports < 2) {
            return unstable("The loaded part of the bridge needs at least two supports.", totalLength, totalLoad);
        }
        if (!hasPinned) {
            return unstable("Add at least one pinned support for horizontal stability.", totalLength, totalLoad);
        }
        if (componentMembers + reactions < 2 * componentJoints) {
            return unstable("Structure appears unstable or incomplete: members + reactions must be at least 2 × joints.",
                    totalLength, totalLoad);
        }

        BridgeMapper.MappedBridge mapped;
        AnalysisResult solved;
        try {
            mapped = new BridgeMapper().map(jointById, validBeams, supportByJoint, loads, component);
            solved = new MethodOfJointsSolver().solve(mapped.bridge());
        } catch (UnstableStructureException | SingularMatrixException ex) {
            return unstable("The loaded structure cannot be solved: " + ex.getMessage(), totalLength, totalLoad);
        }

        List<MemberResultDto> memberResults = new ArrayList<>();
        double maxUtilization = 0.0;
        int overloadedCount = 0;
        String governingMember = AGGREGATE_ID;
        double componentLength = 0.0;

        for (Member member : mapped.bridge().getMembers()) {
            if (!(member instanceof Beam beam)) {
                continue;
            }
            double force = member.getForce();
            double memberCapacity = beam.getMaxForce();
            double utilization = memberCapacity > 0
                    ? round1(Math.abs(force) / memberCapacity * 100.0)
                    : 0.0;
            boolean overloaded = memberCapacity > 0 && Math.abs(force) >= memberCapacity - 1e-9;
            String type = force > 1e-6 ? "TENSION" : force < -1e-6 ? "COMPRESSION" : "ZERO";
            String memberId = mapped.beamRequestIds().getOrDefault(member.getId(), "B" + (member.getId() + 1));
            memberResults.add(new MemberResultDto(
                    memberId,
                    round1(force),
                    type,
                    overloaded,
                    utilization,
                    round1(member.length())
            ));
            if (utilization > maxUtilization) {
                maxUtilization = utilization;
                governingMember = memberId;
            }
            if (overloaded) {
                overloadedCount++;
            }
            componentLength += member.length();
        }

        boolean pass = overloadedCount == 0 && maxUtilization < 100.0;
        double capacityRating = totalLoad > 0 && maxUtilization > 0
                ? round1(totalLoad * 100.0 / maxUtilization)
                : 0.0;
        boolean approximate = solved.getWarnings().stream()
                .anyMatch(warning -> warning.toLowerCase(Locale.ROOT).contains("indeterminate"));

        String message;
        if (totalLoad <= 0) {
            message = "No load applied. Add a load to rate the bridge.";
        } else if (pass) {
            message = "Member check: " + round1(totalLoad) + " kN total load is within capacity. Governing member "
                    + governingMember + " at " + maxUtilization + "%."
                    + (approximate ? " (Indeterminate approximation.)" : "");
        } else {
            message = "Overload: " + overloadedCount + " member(s) at or above capacity. Governing member "
                    + governingMember + " at " + maxUtilization + "%."
                    + (approximate ? " (Indeterminate approximation.)" : "");
        }

        SummaryDto summary = new SummaryDto(
                governingMember,
                maxUtilization,
                overloadedCount,
                round1(componentLength),
                pass,
                round1(totalLoad),
                capacityRating
        );

        return new AnalysisResponse(
                pass ? "OK" : "OVERLOADED",
                message,
                memberResults,
                buildReactions(solved, mapped),
                summary
        );
    }

    private static List<ReactionDto> buildReactions(AnalysisResult solved, BridgeMapper.MappedBridge mapped) {
        Map<String, double[]> byJoint = new LinkedHashMap<>();
        for (Map.Entry<String, Double> entry : solved.getReactions().entrySet()) {
            String[] parts = entry.getKey().split(":");
            if (parts.length != 2) {
                continue;
            }
            int intJointId;
            try {
                intJointId = Integer.parseInt(parts[0]);
            } catch (NumberFormatException ex) {
                continue;
            }
            String requestJointId = mapped.jointRequestIds().get(intJointId);
            if (requestJointId == null) {
                continue;
            }
            double[] reaction = byJoint.computeIfAbsent(requestJointId, key -> new double[2]);
            if ("X".equals(parts[1])) {
                reaction[0] = entry.getValue();
            } else if ("Y".equals(parts[1])) {
                reaction[1] = entry.getValue();
            }
        }

        List<ReactionDto> result = new ArrayList<>();
        for (String jointId : mapped.jointRequestIds().values()) {
            double[] reaction = byJoint.get(jointId);
            if (reaction != null) {
                result.add(new ReactionDto(jointId, round1(reaction[0]), round1(reaction[1])));
            }
        }
        return result;
    }

    private Set<String> resolveComponent(Map<String, Set<String>> adjacency,
                                         Map<String, String> supportByJoint,
                                         List<LoadDto> loads) {
        String start = null;
        if (!loads.isEmpty()) {
            start = loads.get(0).joint();
        } else if (!supportByJoint.isEmpty()) {
            start = supportByJoint.keySet().iterator().next();
        }
        if (start == null || !adjacency.containsKey(start)) {
            return Set.of();
        }

        Set<String> visited = new LinkedHashSet<>();
        ArrayDeque<String> queue = new ArrayDeque<>();
        visited.add(start);
        queue.addLast(start);
        while (!queue.isEmpty()) {
            String current = queue.removeFirst();
            for (String next : adjacency.getOrDefault(current, Set.of())) {
                if (visited.add(next)) {
                    queue.addLast(next);
                }
            }
        }
        return visited;
    }

    private AnalysisResponse invalid(String message, double totalLength, double totalLoad) {
        return failure("INVALID", message, totalLength, totalLoad);
    }

    private AnalysisResponse unstable(String message, double totalLength, double totalLoad) {
        return failure("UNSTABLE", message, totalLength, totalLoad);
    }

    private AnalysisResponse failure(String status, String message, double totalLength, double totalLoad) {
        SummaryDto summary = new SummaryDto(
                AGGREGATE_ID,
                0.0,
                0,
                round1(totalLength),
                false,
                round1(totalLoad),
                0.0
        );
        return new AnalysisResponse(status, message, List.of(), List.of(), summary);
    }

    private static int reactionCount(String type) {
        if ("PINNED".equals(type)) {
            return 2;
        }
        if ("ROLLER".equals(type)) {
            return 1;
        }
        return 0;
    }

    private static double distance(JointDto a, JointDto b) {
        return Math.hypot(a.x() - b.x(), a.y() - b.y());
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String displayId(String value) {
        return isBlank(value) ? "(unnamed)" : value;
    }

    private static <T> List<T> safeList(List<T> values) {
        return values == null ? List.of() : values;
    }
}
