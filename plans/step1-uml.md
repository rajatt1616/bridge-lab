# BridgeLab — Step 1: Package Structure & UML Diagram

## Folder Layout
```
BridgeLab/
  src/
    model/
      Joint.java
      abstract Member.java
      Beam.java
      CableMember.java (optional)
      abstract Support.java
      PinnedSupport.java
      RollerSupport.java
      Load.java
      Bridge.java
      Material.java (enum)
    solver/
      interface StructuralSolver.java
      MethodOfJointsSolver.java
      AnalysisResult.java
      UnstableStructureException.java
      SingularMatrixException.java
    ui/
      MainFrame.java
      BridgePanel.java
      ToolbarPanel.java
      ResultsPanel.java
      LoadDialog.java
      ComparePanel.java
    controller/
      EditorController.java
    util/
      Vector2D.java
      GaussianEliminator.java
  plans/
    1793122564213-bridge-bridge-lab-plan.md
```

## UML-Style Class Diagram (text)

```
                        +------------------+
                        |    <<enum>>      |
                        |     Material     |
                        | name, maxT, ...  |
                        +------------------+
                                ^
                                | used by
+----------------+  owns  +------------------+
|     Bridge     |<>---->|  List<Member>    |
| joints, beams  |       |  members         |
| supports, loads|       |  supports, loads |
+----------------+       +------------------+
         ^
         | contains
+----------------+      +------------------+
|  Joint (id,x,y)|      | abstract Member  |<------------------+
+----------------+      | id, jA, jB       |                   |
                        | length(), force  |                   |
                        | status(), isOver..|                  |
                        +------------------+                  |
                                 ^                             |
                     extends    |                             extends
                +------------+------------+           +----------------+
                |  Beam (maxForce, mat)   |           | CableMember    |
                +-------------------------+           +----------------+
                        ^
                        | extends
                  +-------------------+
                  | abstract Support  |
                  | joint, reaction.. |
                  +-------------------+
                       ^        ^
              extends |        | extends
          +-------------+   +-------------+
          | PinnedSup.. |   | RollerSup.. |
          +-------------+   +-------------+

+------------------+    +-------------------+
|     Load         |    | StructuralSolver  |<<interface>>
| joint, fx, fy    |    | solve(Bridge)     |
+------------------+    +-------------------+
                              ^
                      implements
                              |
                        +-------------------+
                        | MethodOfJointsSol.|
                        +-------------------+
                        | GaussianEliminator|
                        +-------------------+

+------------------+    +-------------------+
| AnalysisResult   |    |  EditorController  |
| forces, reactions|    | mode state machine  |
| warnings, flag   |    +-------------------+
+------------------+
```

## Key Relationships
- Bridge owns collections (encapsulation).
- MethodOfJointsSolver uses GaussianEliminator (composition/utility).
- EditorController interacts with Bridge (model) and updates BridgePanel (view) without Swing imports in model/solver.
- Material enum used by Beam; not by UI directly.
