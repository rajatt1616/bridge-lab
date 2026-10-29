package ui;

import javax.swing.*;
import javax.swing.table.*;
import java.awt.*;
import java.util.*;
import solver.AnalysisResult;

/** Results table showing member forces and overload status. Demonstrates observer-like update. */
public class ResultsPanel extends JPanel {
    private JTable table;
    private DefaultTableModel model;

    public ResultsPanel() {
        setLayout(new BorderLayout());
        model = new DefaultTableModel(new String[]{"Beam", "Force", "Status"}, 0);
        table = new JTable(model);
        add(new JScrollPane(table), BorderLayout.CENTER);
        add(new JLabel("Run Analyze to populate results"), BorderLayout.NORTH);
    }

    public void update(AnalysisResult result) {
        model.setRowCount(0);
        for (Map.Entry<Integer, Double> entry : result.getMemberForces().entrySet()) {
            double f = entry.getValue();
            String status = f > 0 ? "Tension" : (f < 0 ? "Compression" : "Zero");
            model.addRow(new Object[]{"B" + entry.getKey(), String.format("%.2f", f), status});
        }
    }
}
