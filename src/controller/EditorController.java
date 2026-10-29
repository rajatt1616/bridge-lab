package controller;

import model.*;

/** Mode state machine controlling editor behavior. Demonstrates state pattern basics. */
public class EditorController {
    public enum Mode {
        SELECT, ADD_JOINT, ADD_BEAM, SET_SUPPORT, APPLY_LOAD, DELETE
    }

    private Mode currentMode = Mode.SELECT;
    private Joint selectedJoint = null;
    private Joint firstJointForBeam = null;

    public Mode getMode() { return currentMode; }
    public void setMode(Mode m) { currentMode = m; }

    public Joint getSelectedJoint() { return selectedJoint; }
    public void selectJoint(Joint j) { this.selectedJoint = j; }
    public void clearSelection() { this.selectedJoint = null; }

    public Joint getFirstJointForBeam() { return firstJointForBeam; }
    public void setFirstJointForBeam(Joint j) { this.firstJointForBeam = j; }
    public void clearBeamSelection() { this.firstJointForBeam = null; }
}
