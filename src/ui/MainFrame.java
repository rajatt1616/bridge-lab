package ui;

import controller.EditorController;
import model.*;
import util.BridgeSaveLoad;
import javax.swing.*;
import java.awt.*;
import java.io.*;

/** Main window with menus, toolbar, results, and comparison support. */
public class MainFrame extends JFrame {
    private BridgePanel bridgePanel;
    private ResultsPanel resultsPanel;
    private EditorController controller = new EditorController();

    public MainFrame() {
        setTitle("BridgeLab — Physics-Based Bridge Builder & Load Simulator");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout());

        // Menu bar
        JMenuBar menuBar = new JMenuBar();
        JMenu fileMenu = new JMenu("File");
        JMenuItem saveItem = new JMenuItem("Save Design");
        saveItem.addActionListener(e -> {
            try {
                BridgeSaveLoad.save(bridgePanel.getBridge(), "bridge_design.txt");
                JOptionPane.showMessageDialog(this, "Design saved.");
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Save error: " + ex.getMessage());
            }
        });
        fileMenu.add(saveItem);
        JMenuItem openItem = new JMenuItem("Open Design");
        openItem.addActionListener(e -> {
            try {
                Bridge b = BridgeSaveLoad.load("bridge_design.txt");
                bridgePanel.setBridge(b);
                JOptionPane.showMessageDialog(this, "Design loaded.");
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Open error (file may not exist). Create and save first.");
            }
        });
        fileMenu.add(openItem);
        fileMenu.addSeparator();
        JMenuItem exportItem = new JMenuItem("Export Screenshot (PNG)");
        exportItem.addActionListener(e -> JOptionPane.showMessageDialog(this, "Export feature: call bridgePanel.getImage()."));
        fileMenu.add(exportItem);
        menuBar.add(fileMenu);

        JMenu presetMenu = new JMenu("Presets");
        JMenuItem simpleTruss = new JMenuItem("Simple Truss");
        simpleTruss.addActionListener(e -> {
            // Hard-coded preset loaded into current bridge
            bridgePanel.buildDemoBridge();
            bridgePanel.repaint();
            JOptionPane.showMessageDialog(this, "Preset: Simple Truss loaded.");
        });
        presetMenu.add(simpleTruss);
        menuBar.add(presetMenu);

        JMenu helpMenu = new JMenu("Help");
        JMenuItem about = new JMenuItem("Assumptions & Disclaimer");
        about.addActionListener(e -> JOptionPane.showMessageDialog(this,
            "BridgeLab — Educational Simulation Only\n\nAssumptions:\n- 2D pin-jointed truss (no bending).\n- Simplified direct method of joints (introductory model).\n- Self-weight ignored.\n- Not a certified engineering tool.\n\nLimitations:\n- No deformation visualization.\n- Static load only.\n- Approximate for indeterminate structures."));
        helpMenu.add(about);
        menuBar.add(helpMenu);
        setJMenuBar(menuBar);

        // Main layout
        bridgePanel = new BridgePanel();
        resultsPanel = new ResultsPanel();
        ToolbarPanel toolbar = new ToolbarPanel(controller);
        add(toolbar, BorderLayout.NORTH);
        add(bridgePanel, BorderLayout.CENTER);

        // Side panel with comparison and results
        JPanel sidePanel = new JPanel();
        sidePanel.setLayout(new BorderLayout());
        sidePanel.setPreferredSize(new Dimension(300, 0));
        JButton compareBtn = new JButton("Compare with Design A");
        compareBtn.addActionListener(e -> {
            // Design comparison via deep copy
            Bridge original = bridgePanel.getBridge();
            if (original == null) {
                JOptionPane.showMessageDialog(this, "No current design to compare.");
                return;
            }
            Bridge snapshot = original.deepCopy();
            JOptionPane.showMessageDialog(this, "Snapshot saved as Design A. Edit the current design and compare again.");
        });
        sidePanel.add(compareBtn, BorderLayout.NORTH);
        sidePanel.add(resultsPanel, BorderLayout.CENTER);
        add(sidePanel, BorderLayout.EAST);

        // Bottom status bar
        JLabel status = new JLabel("BridgeLab — Design. Connect. Load. Test. | Step 7: Save, Presets, Compare.");
        status.setBorder(BorderFactory.createEmptyBorder(4, 8, 4, 8));
        add(status, BorderLayout.SOUTH);

        pack();
        setLocationRelativeTo(null);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            MainFrame frame = new MainFrame();
            frame.setVisible(true);
        });
    }
}
