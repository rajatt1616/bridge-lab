package ui;

import javax.swing.*;
import java.awt.*;
import java.util.*;
import model.*;
import controller.EditorController;
import solver.AnalysisResult;

/** Custom 2D drawing panel. No logic beyond drawing. Hard-coded demo bridge. */
public class BridgePanel extends JPanel {
    private Bridge bridge;
    private boolean showGrid = true;
    private EditorController controller = new EditorController();
    private AnalysisResult analysisResult = null;

    public BridgePanel() {
        setBackground(Color.WHITE);
        setPreferredSize(new Dimension(800, 600));
        // Hard-coded demo bridge for Step 4
        buildDemoBridge();

        addMouseListener(new java.awt.event.MouseAdapter() {
            @Override
            public void mouseClicked(java.awt.event.MouseEvent e) {
                int mx = e.getX();
                int my = e.getY();
                Joint clicked = null;
                for (Joint j : bridge.getJoints()) {
                    if (Math.abs(j.getX() - mx) < 15 && Math.abs(j.getY() - my) < 15) {
                        clicked = j;
                        break;
                    }
                }
                if (clicked != null) {
                    controller.selectJoint(clicked);
                    if (controller.getMode() == EditorController.Mode.ADD_BEAM) {
                        if (controller.getFirstJointForBeam() == null) {
                            controller.setFirstJointForBeam(clicked);
                        } else {
                            controller.clearBeamSelection();
                        }
                    }
                } else {
                    controller.clearSelection();
                }
                repaint();
            }
        });
    }

    public void buildDemoBridge() {
        bridge = new Bridge();
        Joint j0 = new Joint(0, 100, 400);
        Joint j1 = new Joint(1, 500, 400);
        Joint j2 = new Joint(2, 300, 150);
        bridge.addJoint(j0);
        bridge.addJoint(j1);
        bridge.addJoint(j2);
        bridge.addMember(new Beam(0, j0, j1, 300, Material.STEEL));
        bridge.addMember(new Beam(1, j1, j2, 300, Material.STEEL));
        bridge.addMember(new Beam(2, j2, j0, 300, Material.STEEL));
        bridge.addSupport(new PinnedSupport(j0));
        bridge.addSupport(new RollerSupport(j1));
        bridge.addLoad(new Load(j2, 0, -100)); // downward
    }

    public void setAnalysisResult(AnalysisResult result) {
        this.analysisResult = result;
        repaint();
    }

    public void setBridge(Bridge b) { this.bridge = b; repaint(); }
    public Bridge getBridge() { return bridge; }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Draw grid
        if (showGrid) {
            g2.setColor(new Color(220, 220, 240));
            for (int x = 0; x < getWidth(); x += 50) {
                g2.drawLine(x, 0, x, getHeight());
            }
            for (int y = 0; y < getHeight(); y += 50) {
                g2.drawLine(0, y, getWidth(), y);
            }
        }

        if (bridge == null) {
            g2.dispose();
            return;
        }

        // Highlight selected joint
        if (controller.getSelectedJoint() != null) {
            Joint sel = controller.getSelectedJoint();
            g2.setColor(Color.YELLOW);
            g2.setStroke(new BasicStroke(3));
            g2.drawOval((int) sel.getX() - 10, (int) sel.getY() - 10, 20, 20);
        }

        // Draw members (beams) - color coded by analysis or default gray
        for (Member m : bridge.getMembers()) {
            Joint a = m.getJointA();
            Joint b = m.getJointB();
            Color memberColor = Color.DARK_GRAY;
            int thickness = 3;
            if (analysisResult != null && analysisResult.isSolved()) {
                Double fObj = analysisResult.getMemberForces().get(m.getId());
                if (fObj != null) {
                    double f = fObj;
                    if (Math.abs(f) < 0.01) {
                        memberColor = Color.GRAY;
                        thickness = 1;
                    } else if (f > 0) {
                        memberColor = Color.BLUE;
                    } else {
                        memberColor = Color.RED;
                    }
                    // Overload check: if absolute force exceeds a demo threshold, orange
                    if (Math.abs(f) > 300) {
                        memberColor = Color.ORANGE;
                        thickness = 5;
                    }
                }
            }
            g2.setColor(memberColor);
            g2.setStroke(new BasicStroke(thickness));
            g2.drawLine((int) a.getX(), (int) a.getY(), (int) b.getX(), (int) b.getY());
            // Label near midpoint
            int mx = (int) ((a.getX() + b.getX()) / 2);
            int my = (int) ((a.getY() + b.getY()) / 2);
            g2.setColor(Color.BLACK);
            g2.drawString("B" + m.getId(), mx, my);
        }

        // Draw supports
        for (Support s : bridge.getSupports()) {
            Joint j = s.getJoint();
            int cx = (int) j.getX();
            int cy = (int) j.getY();
            if (s instanceof PinnedSupport) {
                g2.setColor(Color.BLUE);
                // Triangle symbol
                int[] xs = { cx - 12, cx + 12, cx };
                int[] ys = { cy + 10, cy + 10, cy - 10 };
                g2.fillPolygon(xs, ys, 3);
                g2.setColor(Color.WHITE);
                g2.drawString("P", cx - 4, cy + 4);
            } else if (s instanceof RollerSupport) {
                g2.setColor(Color.GREEN);
                g2.fillOval(cx - 8, cy - 8, 16, 16);
                g2.setColor(Color.WHITE);
                g2.drawString("R", cx - 3, cy + 3);
            }
        }

        // Draw joints
        g2.setColor(Color.RED);
        for (Joint j : bridge.getJoints()) {
            g2.fillOval((int) j.getX() - 5, (int) j.getY() - 5, 10, 10);
            g2.setColor(Color.WHITE);
            g2.drawString("J" + j.getId(), (int) j.getX() + 8, (int) j.getY() - 8);
            g2.setColor(Color.RED);
        }

        // Draw loads (downward arrows)
        g2.setColor(Color.ORANGE);
        for (Load l : bridge.getLoads()) {
            Joint j = l.getJoint();
            int cx = (int) j.getX();
            int cy = (int) j.getY();
            g2.setStroke(new BasicStroke(2));
            g2.drawLine(cx, cy, cx, cy + 30);
            int[] xs = { cx - 6, cx + 6, cx };
            int[] ys = { cy + 30, cy + 30, cy + 45 };
            g2.fillPolygon(xs, ys, 3);
            g2.setColor(Color.BLACK);
            g2.drawString(String.format("%.0f", Math.abs(l.getFy())), cx + 10, cy + 25);
        }

        // Legend
        g2.setColor(Color.BLACK);
        int ly = 20;
        g2.drawString("Legend: Blue=Pinned, Green=Roller, Red=Joint, Gray=Member, Orange=Load", 20, ly);
        g2.drawString("DISCLAIMER: Educational simulation only; not certified engineering tool.", 20, ly + 15);

        g2.dispose();
    }
}
