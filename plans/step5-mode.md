# Step 5 — Mouse Interaction & Modes

- EditorController: state machine (SELECT, ADD_JOINT, ADD_BEAM, SET_SUPPORT, APPLY_LOAD, DELETE).
- ToolbarPanel: buttons that call controller.setMode().
- BridgePanel: mouse listener selects joint (within 15 px); ADD_BEAM mode selects first joint then second; selection highlighted with yellow circle; no Swing imports in model/controller.
