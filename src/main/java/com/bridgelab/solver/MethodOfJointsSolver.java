package com.bridgelab.solver;

import com.bridgelab.model.Bridge;
import com.bridgelab.model.Joint;
import com.bridgelab.model.Load;
import com.bridgelab.model.Member;
import com.bridgelab.model.PinnedSupport;
import com.bridgelab.model.Support;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Method of joints solver for 2D trusses. Educational accuracy only. */
public class MethodOfJointsSolver implements StructuralSolver {

    private static final double EPSILON = 1e-9;
    private static final double DAMPING = 1e-7;
    private static final double RESIDUAL_TOLERANCE = 1e-6;

    @Override
    public AnalysisResult solve(Bridge bridge) throws UnstableStructureException, SingularMatrixException {
        AnalysisResult result = new AnalysisResult();
        result.addWarning("Simplified educational solver. Not for certified engineering use.");

        List<Joint> joints = bridge.getJoints();
        List<Member> members = bridge.getMembers();
        List<Support> supports = bridge.getSupports();
        List<Load> loads = bridge.getLoads();

        if (joints.isEmpty()) {
            throw new UnstableStructureException("No joints defined.");
        }
        if (members.isEmpty()) {
            result.setSolved(false);
            result.setStable(false);
            throw new UnstableStructureException("No members: mechanism or missing structure.");
        }
        if (supports.isEmpty()) {
            throw new UnstableStructureException("No supports: structure will fall.");
        }

        int jointCount = joints.size();
        int memberCount = members.size();
        List<Reaction> reactions = buildReactions(supports);
        int unknownCount = memberCount + reactions.size();
        int equationCount = 2 * jointCount;

        if (unknownCount < equationCount) {
            throw new UnstableStructureException(
                    "Structure appears unstable or a mechanism. Unknowns=" + unknownCount
                            + ", equilibrium equations=" + equationCount);
        }
        if (unknownCount > equationCount) {
            result.addWarning("Structure is statically indeterminate. Using a damped least-squares approximation.");
        }

        Map<Integer, Integer> jointIndex = new HashMap<>();
        for (int i = 0; i < jointCount; i++) {
            jointIndex.put(joints.get(i).getId(), i);
        }

        double[][] matrix = new double[equationCount][unknownCount];
        double[] rhs = new double[equationCount];

        for (Load load : loads) {
            Integer index = jointIndex.get(load.getJoint().getId());
            if (index == null) {
                continue;
            }
            rhs[2 * index] -= load.getFx();
            rhs[2 * index + 1] -= load.getFy();
        }

        for (int m = 0; m < memberCount; m++) {
            Member member = members.get(m);
            Integer indexA = jointIndex.get(member.getJointA().getId());
            Integer indexB = jointIndex.get(member.getJointB().getId());
            if (indexA == null || indexB == null) {
                throw new UnstableStructureException("Member references an unknown joint.");
            }
            double dx = member.getJointB().getX() - member.getJointA().getX();
            double dy = member.getJointB().getY() - member.getJointA().getY();
            double length = Math.hypot(dx, dy);
            if (length < EPSILON) {
                throw new UnstableStructureException("Member " + member.getId() + " has zero length.");
            }
            double cx = dx / length;
            double cy = dy / length;
            matrix[2 * indexA][m] += cx;
            matrix[2 * indexA + 1][m] += cy;
            matrix[2 * indexB][m] -= cx;
            matrix[2 * indexB + 1][m] -= cy;
        }

        for (int r = 0; r < reactions.size(); r++) {
            Reaction reaction = reactions.get(r);
            Integer index = jointIndex.get(reaction.joint().getId());
            if (index == null) {
                continue;
            }
            int column = memberCount + r;
            if (reaction.axis() == ReactionAxis.X) {
                matrix[2 * index][column] += 1.0;
            } else {
                matrix[2 * index + 1][column] += 1.0;
            }
        }

        double[] solution;
        if (unknownCount == equationCount) {
            solution = GaussianEliminator.solve(matrix, rhs);
        } else {
            solution = solveDampedLeastSquares(matrix, rhs);
        }

        double residual = residualNorm(matrix, rhs, solution);
        double loadNorm = Math.max(1.0, norm(rhs));
        if (residual > RESIDUAL_TOLERANCE * loadNorm) {
            throw new UnstableStructureException("Structure cannot carry the applied load (mechanism or missing load path).");
        }

        for (int m = 0; m < memberCount; m++) {
            Member member = members.get(m);
            member.setForce(solution[m]);
            result.setMemberForce(member.getId(), solution[m]);
        }
        for (int r = 0; r < reactions.size(); r++) {
            Reaction reaction = reactions.get(r);
            double value = solution[memberCount + r];
            result.setReaction(reaction.joint().getId() + ":" + reaction.axis().name(), value);
        }

        result.setStable(true);
        result.setSolved(true);
        return result;
    }

    private static List<Reaction> buildReactions(List<Support> supports) {
        List<Reaction> reactions = new ArrayList<>();
        for (Support support : supports) {
            if (support instanceof PinnedSupport) {
                reactions.add(new Reaction(support.getJoint(), ReactionAxis.X));
                reactions.add(new Reaction(support.getJoint(), ReactionAxis.Y));
            } else {
                reactions.add(new Reaction(support.getJoint(), ReactionAxis.Y));
            }
        }
        return reactions;
    }

    private static double[] solveDampedLeastSquares(double[][] matrix, double[] rhs)
            throws SingularMatrixException {
        int rows = matrix.length;
        int columns = matrix[0].length;
        double[][] normal = new double[columns][columns];
        double[] target = new double[columns];

        for (int i = 0; i < columns; i++) {
            for (int j = 0; j < columns; j++) {
                double sum = 0.0;
                for (int r = 0; r < rows; r++) {
                    sum += matrix[r][i] * matrix[r][j];
                }
                normal[i][j] = sum;
            }
            double sum = 0.0;
            for (int r = 0; r < rows; r++) {
                sum += matrix[r][i] * rhs[r];
            }
            target[i] = sum;
            normal[i][i] += DAMPING;
        }
        return GaussianEliminator.solve(normal, target);
    }

    private static double residualNorm(double[][] matrix, double[] rhs, double[] solution) {
        double sum = 0.0;
        for (int row = 0; row < matrix.length; row++) {
            double value = 0.0;
            for (int column = 0; column < matrix[row].length; column++) {
                value += matrix[row][column] * solution[column];
            }
            double difference = value - rhs[row];
            sum += difference * difference;
        }
        return Math.sqrt(sum);
    }

    private static double norm(double[] values) {
        double sum = 0.0;
        for (double value : values) {
            sum += value * value;
        }
        return Math.sqrt(sum);
    }

    private enum ReactionAxis { X, Y }

    private record Reaction(Joint joint, ReactionAxis axis) {}
}
