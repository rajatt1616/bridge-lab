package solver;

import model.Bridge;

/** Solver interface demonstrating abstraction and strategy pattern. */
public interface StructuralSolver {
    AnalysisResult solve(Bridge bridge) throws UnstableStructureException, SingularMatrixException;
}
