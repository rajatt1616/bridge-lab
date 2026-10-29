# BridgeLab — Likely Viva / Evaluator Questions & Answers

## Q1: Why did you choose the direct method of joints?
A: It fits an introductory mechanics course. It builds equilibrium equations (ΣFx=0, ΣFy=0) directly from joint free-body diagrams, making the physics transparent. A stiffness matrix approach hides the equilibrium intuition behind linear algebra abstraction.

## Q2: How is instability detected?
A: Before solving, we check members + reactions >= 2 * joints (stability estimate). If the matrix is singular during Gaussian elimination, we throw SingularMatrixException. If no members or no supports exist, UnstableStructureException is thrown with a clear message.

## Q3: Where is inheritance shown?
A: `abstract Member` -> `Beam` / `CableMember`; `abstract Support` -> `PinnedSupport` / `RollerSupport`. The solver and UI call overridden methods (`isOverloaded()`, `reactionCount()`, `getType()`).

## Q4: Where is polymorphism shown?
A: `MethodOfJointsSolver.solve(Bridge)` treats members and supports as abstract types. The UI color-codes members by calling `getStatus()` (updated via `updateStatus()` overridden in subclasses). The result table iterates over `List<Member>` without checking concrete types.

## Q5: Why is Bridge.deepCopy() important?
A: It supports design comparison (snapshot / Memento-like behavior). The user can edit the current design, compare with a saved snapshot, and see changes without losing the original. It also demonstrates deep copying and collections handling.

## Q6: Why no external physics library?
A: The assignment requires demonstrating custom math (Gaussian elimination) and clear code explanation. External libraries would hide the solver logic from the evaluator.

## Q7: What are the main limitations?
A: Educational accuracy only: 2D truss model, no bending, no dynamics, self-weight ignored, approximate for indeterminate structures. The app shows a clear disclaimer in Help/About and the legend.

## Q8: How does mouse interaction work?
A: `BridgePanel` uses a `MouseAdapter` to detect clicks within 15 px of a joint. The `EditorController` mode machine selects joints, starts beam creation, applies loads, or deletes elements. Selection is highlighted in yellow.
