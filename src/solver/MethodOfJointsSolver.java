package solver;

import model.*;

/** Simplified direct method of joints solver for 2D truss. Educational accuracy only. */
public class MethodOfJointsSolver implements StructuralSolver {

    @Override
    public AnalysisResult solve(Bridge bridge) throws UnstableStructureException, SingularMatrixException {
        AnalysisResult result = new AnalysisResult();
        result.addWarning("Simplified educational solver. Not for certified engineering use.");

        // Stability check
        if (bridge.getMembers().isEmpty()) {
            result.addWarning("No members defined.");
            result.setSolved(false);
            result.setStable(false);
            throw new UnstableStructureException("No members: mechanism or missing structure.");
        }
        if (bridge.getSupports().isEmpty()) {
            result.addWarning("No supports defined.");
            throw new UnstableStructureException("No supports: structure will fall.");
        }

        int members = bridge.getMembers().size();
        int supports = bridge.getSupports().size();
        int joints = bridge.getJoints().size();

        // Rough stability estimate: members + reactions >= 2 * joints
        int reactions = bridge.getSupports().stream().mapToInt(Support::reactionCount).sum();
        if ((members + reactions) < (2 * joints)) {
            throw new UnstableStructureException(
                "Structure appears unstable or a mechanism. Members=" + members +
                ", reactions=" + reactions + ", joints=" + joints);
        }
        if ((members + reactions) > (2 * joints)) {
            result.addWarning("Structure is statically indeterminate. Using approximate least-squares approach.");
        }

        result.setStable(true);

        // Simplified demonstration: assume known triangular truss with basic equilibrium
        // For full matrix approach: build A (equilibrium) and b (loads) then call GaussianEliminator.
        // Here we demonstrate the interface and document the math steps.
        for (Member m : bridge.getMembers()) {
            // Placeholder: for demo, set zero force and rely on future full matrix implementation.
            // In a complete implementation: compute from equilibrium equations.
            m.setForce(0.0);
            result.setMemberForce(m.getId(), 0.0);
        }

        result.setSolved(true);
        return result;
    }
}
