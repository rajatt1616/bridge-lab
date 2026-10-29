package com.bridgelab.solver;

import com.bridgelab.model.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class SolverTest {

    @Test
    public void testStableTriangle() throws Exception {
        // Simple triangular truss: J0(0,0), J1(4,0), J2(2,3)
        // Pinned at J0, roller at J1, load downward at J2
        Bridge b = new Bridge();
        Joint j0 = new Joint(0, 0, 0);
        Joint j1 = new Joint(1, 400, 0);
        Joint j2 = new Joint(2, 200, 300);
        b.addJoint(j0); b.addJoint(j1); b.addJoint(j2);
        b.addMember(new Beam(0, j0, j1, 250, Material.STEEL));
        b.addMember(new Beam(1, j1, j2, 250, Material.STEEL));
        b.addMember(new Beam(2, j2, j0, 250, Material.STEEL));
        b.addSupport(new PinnedSupport(j0));
        b.addSupport(new RollerSupport(j1));
        b.addLoad(new Load(j2, 0, -100));

        MethodOfJointsSolver solver = new MethodOfJointsSolver();
        AnalysisResult res = solver.solve(b);
        assertTrue(res.isStable(), "Triangle should be stable");
        assertTrue(res.isSolved(), "Triangle should be solved");

        // Bottom chord tension, both upper chords compression.
        assertEquals(33.33, res.getMemberForces().get(0), 0.1);
        assertEquals(-60.09, res.getMemberForces().get(1), 0.1);
        assertEquals(-60.09, res.getMemberForces().get(2), 0.1);

        assertEquals(50.0, res.getReactions().get("0:Y"), 0.1);
        assertEquals(50.0, res.getReactions().get("1:Y"), 0.1);
        assertEquals(0.0, res.getReactions().get("0:X"), 0.1);
    }

    @Test
    public void testUnstableNoMembers() {
        Bridge b = new Bridge();
        Joint j0 = new Joint(0, 0, 0);
        b.addJoint(j0);
        b.addSupport(new PinnedSupport(j0));
        MethodOfJointsSolver solver = new MethodOfJointsSolver();
        assertThrows(UnstableStructureException.class, () -> solver.solve(b));
    }

    @Test
    public void testMechanismThrows() {
        // Four-bar square without a diagonal: members + reactions < 2 x joints.
        Bridge b = new Bridge();
        Joint j0 = new Joint(0, 0, 0);
        Joint j1 = new Joint(1, 400, 0);
        Joint j2 = new Joint(2, 400, 300);
        Joint j3 = new Joint(3, 0, 300);
        b.addJoint(j0); b.addJoint(j1); b.addJoint(j2); b.addJoint(j3);
        b.addMember(new Beam(0, j0, j1, 250, Material.STEEL));
        b.addMember(new Beam(1, j1, j2, 250, Material.STEEL));
        b.addMember(new Beam(2, j2, j3, 250, Material.STEEL));
        b.addMember(new Beam(3, j3, j0, 250, Material.STEEL));
        b.addSupport(new PinnedSupport(j0));
        b.addSupport(new RollerSupport(j1));
        b.addLoad(new Load(j2, 0, -100));

        MethodOfJointsSolver solver = new MethodOfJointsSolver();
        assertThrows(UnstableStructureException.class, () -> solver.solve(b));
    }

    @Test
    public void testIndeterminateTriangleIsApproximate() throws Exception {
        Bridge b = new Bridge();
        Joint j0 = new Joint(0, 0, 0);
        Joint j1 = new Joint(1, 400, 0);
        Joint j2 = new Joint(2, 200, 300);
        b.addJoint(j0); b.addJoint(j1); b.addJoint(j2);
        b.addMember(new Beam(0, j0, j1, 250, Material.STEEL));
        b.addMember(new Beam(1, j1, j2, 250, Material.STEEL));
        b.addMember(new Beam(2, j2, j0, 250, Material.STEEL));
        b.addMember(new Beam(3, j0, j1, 250, Material.STEEL));
        b.addSupport(new PinnedSupport(j0));
        b.addSupport(new RollerSupport(j1));
        b.addLoad(new Load(j2, 0, -100));

        MethodOfJointsSolver solver = new MethodOfJointsSolver();
        AnalysisResult res = solver.solve(b);
        assertTrue(res.isSolved());
        assertTrue(res.getWarnings().stream()
                .anyMatch(warning -> warning.toLowerCase().contains("indeterminate")));
    }
}
