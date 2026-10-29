package com.bridgelab.mapper;

import com.bridgelab.dto.BeamDto;
import com.bridgelab.dto.JointDto;
import com.bridgelab.dto.LoadDto;
import com.bridgelab.model.Beam;
import com.bridgelab.model.Bridge;
import com.bridgelab.model.Joint;
import com.bridgelab.model.Load;
import com.bridgelab.model.Material;
import com.bridgelab.model.PinnedSupport;
import com.bridgelab.model.RollerSupport;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Maps web DTOs into the framework-free structural model. */
public class BridgeMapper {

    public record MappedBridge(Bridge bridge,
                               Map<Integer, String> beamRequestIds,
                               Map<Integer, String> jointRequestIds) {}

    public MappedBridge map(Map<String, JointDto> jointById,
                            List<BeamDto> beams,
                            Map<String, String> supportByJoint,
                            List<LoadDto> loads,
                            Set<String> includedJointIds) {
        Bridge bridge = new Bridge();
        Map<String, Joint> jointByRequestId = new LinkedHashMap<>();
        Map<Integer, String> jointRequestIds = new LinkedHashMap<>();

        int nextJointId = 0;
        for (Map.Entry<String, JointDto> entry : jointById.entrySet()) {
            if (!includedJointIds.contains(entry.getKey())) {
                continue;
            }
            JointDto dto = entry.getValue();
            // The model uses Y-up coordinates; the canvas uses Y-down.
            Joint joint = new Joint(nextJointId, dto.x(), -dto.y());
            bridge.addJoint(joint);
            jointByRequestId.put(entry.getKey(), joint);
            jointRequestIds.put(nextJointId, entry.getKey());
            nextJointId++;
        }

        Map<Integer, String> beamRequestIds = new LinkedHashMap<>();
        int nextBeamId = 0;
        for (BeamDto dto : beams) {
            if (dto == null
                    || !includedJointIds.contains(dto.from())
                    || !includedJointIds.contains(dto.to())) {
                continue;
            }
            Joint jointA = jointByRequestId.get(dto.from());
            Joint jointB = jointByRequestId.get(dto.to());
            if (jointA == null || jointB == null) {
                continue;
            }
            Material material = parseMaterial(dto.material());
            double capacity = Math.min(material.getMaxTension(), material.getMaxCompression());
            Beam beam = new Beam(nextBeamId, jointA, jointB, capacity, material);
            bridge.addMember(beam);
            String requestId = isBlank(dto.id()) ? "B" + (nextBeamId + 1) : dto.id();
            beamRequestIds.put(nextBeamId, requestId);
            nextBeamId++;
        }

        for (Map.Entry<String, String> entry : supportByJoint.entrySet()) {
            if (!includedJointIds.contains(entry.getKey())) {
                continue;
            }
            Joint joint = jointByRequestId.get(entry.getKey());
            if (joint == null) {
                continue;
            }
            if ("PINNED".equals(entry.getValue())) {
                bridge.addSupport(new PinnedSupport(joint));
            } else if ("ROLLER".equals(entry.getValue())) {
                bridge.addSupport(new RollerSupport(joint));
            }
        }

        for (LoadDto dto : loads) {
            if (dto == null || !includedJointIds.contains(dto.joint())) {
                continue;
            }
            Joint joint = jointByRequestId.get(dto.joint());
            if (joint == null) {
                continue;
            }
            bridge.addLoad(new Load(joint, dto.fx(), dto.fy()));
        }

        return new MappedBridge(bridge, beamRequestIds, jointRequestIds);
    }

    private static Material parseMaterial(String value) {
        if (isBlank(value)) {
            return Material.STEEL;
        }
        try {
            return Material.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return Material.STEEL;
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
