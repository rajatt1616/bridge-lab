package ui;

import controller.EditorController;
import javax.swing.*;
import java.awt.*;

/** Toolbar with mode buttons. Keeps UI separate from model/solver. */
public class ToolbarPanel extends JPanel {
    private final EditorController controller;

    public ToolbarPanel(EditorController controller) {
        this.controller = controller;
        setLayout(new FlowLayout(FlowLayout.LEFT));
        add(new JLabel("Mode: "));
        String[] modes = {"SELECT", "ADD_JOINT", "ADD_BEAM", "SET_SUPPORT", "APPLY_LOAD", "DELETE"};
        for (String modeName : modes) {
            JButton btn = new JButton(modeName);
            btn.addActionListener(e -> controller.setMode(EditorController.Mode.valueOf(modeName)));
            add(btn);
        }
    }
}
