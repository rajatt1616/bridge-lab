package com.bridgelab.service;

import com.bridgelab.dto.*;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class AnalysisServiceTest {

    private final AnalysisService service = new AnalysisService();

    @Test
    public void stableTriangleBelowCapacityPasses() {
        AnalysisResponse response = service.analyze(triangleRequest(2));

        assertEquals("OK", response.status());
        assertTrue(response.summary().pass());
        assertEquals(200.0, response.summary().totalLoad(), 0.05);
        assertEquals(255.4, response.summary().capacity(), 0.3);
        assertEquals(78.3, response.summary().maxUtilization(), 0.05);
        assertEquals(0, response.summary().overloadedCount());

        assertEquals(3, response.members().size());
        assertEquals("B1", response.members().get(0).id());
        assertEquals("TENSION", response.members().get(0).type());
        assertEquals("B2", response.members().get(1).id());
        assertEquals("COMPRESSION", response.members().get(1).type());
        assertEquals("B3", response.members().get(2).id());
        assertEquals("COMPRESSION", response.members().get(2).type());
        assertFalse(response.members().get(0).overloaded());

        assertEquals(2, response.reactions().size());
        ReactionDto left = response.reactions().get(0);
        ReactionDto right = response.reactions().get(1);
        assertEquals("J1", left.joint());
        assertEquals(0.0, left.rx(), 0.05);
        assertEquals(100.0, left.ry(), 0.05);
        assertEquals("J2", right.joint());
        assertEquals(0.0, right.rx(), 0.05);
        assertEquals(100.0, right.ry(), 0.05);
    }

    @Test
    public void loadAtCapacityFails() {
        AnalysisResponse response = service.analyze(triangleRequest(3));

        assertEquals("OVERLOADED", response.status());
        assertFalse(response.summary().pass());
        assertEquals(300.0, response.summary().totalLoad(), 0.05);
        assertEquals(117.4, response.summary().maxUtilization(), 0.1);
        assertEquals(3, response.summary().overloadedCount());
        assertEquals(3, response.members().size());
        assertTrue(response.members().stream().allMatch(MemberResultDto::overloaded));
    }

    @Test
    public void loadAboveCapacityFails() {
        AnalysisResponse response = service.analyze(triangleRequest(4));

        assertEquals("OVERLOADED", response.status());
        assertFalse(response.summary().pass());
        assertEquals(400.0, response.summary().totalLoad(), 0.05);
        assertEquals(156.5, response.summary().maxUtilization(), 0.1);
    }

    @Test
    public void noLoadStillReportsMemberResults() {
        AnalysisResponse response = service.analyze(triangleRequest(0));

        assertEquals("OK", response.status());
        assertTrue(response.summary().pass());
        assertEquals(0.0, response.summary().totalLoad(), 0.05);
        assertEquals(0.0, response.summary().maxUtilization(), 0.05);
        assertEquals(0.0, response.summary().capacity(), 0.05);
        assertEquals(3, response.members().size());
        assertTrue(response.members().stream().allMatch(member -> "ZERO".equals(member.type())));
    }

    @Test
    public void missingSupportsIsUnstable() {
        AnalysisRequest base = triangleRequest(1);
        AnalysisRequest request = new AnalysisRequest(base.joints(), base.beams(), List.of(), base.loads(), 300);
        AnalysisResponse response = service.analyze(request);

        assertEquals("UNSTABLE", response.status());
        assertFalse(response.summary().pass());
        assertEquals(0.0, response.summary().capacity(), 0.05);
        assertTrue(response.members().isEmpty());
    }

    @Test
    public void disconnectedLoadIsUnstable() {
        AnalysisRequest base = triangleRequest(1);
        List<JointDto> joints = new ArrayList<>(base.joints());
        JointDto extra = new JointDto("J4", 650, 350);
        joints.add(extra);
        List<LoadDto> loads = List.of(new LoadDto("J4", 0, -100));
        AnalysisRequest request = new AnalysisRequest(joints, base.beams(), base.supports(), loads, 300);
        AnalysisResponse response = service.analyze(request);

        assertEquals("UNSTABLE", response.status());
        assertFalse(response.summary().pass());
        assertTrue(response.message().toLowerCase().contains("support"));
    }

    @Test
    public void indeterminateBridgeIsSolvedApproximately() {
        AnalysisRequest base = triangleRequest(1);
        List<BeamDto> beams = new ArrayList<>(base.beams());
        beams.add(new BeamDto("B4", "J1", "J2", "STEEL"));
        AnalysisRequest request = new AnalysisRequest(base.joints(), beams, base.supports(), base.loads(), 300);
        AnalysisResponse response = service.analyze(request);

        assertEquals("OK", response.status());
        assertTrue(response.summary().pass());
        assertEquals(4, response.members().size());
        assertTrue(response.message().contains("Indeterminate approximation"));
    }

    private AnalysisRequest triangleRequest(int loadCount) {
        List<JointDto> joints = List.of(
                new JointDto("J1", 255, 270),
                new JointDto("J2", 625, 270),
                new JointDto("J3", 440, 160)
        );
        List<BeamDto> beams = List.of(
                new BeamDto("B1", "J1", "J2", "STEEL"),
                new BeamDto("B2", "J2", "J3", "STEEL"),
                new BeamDto("B3", "J3", "J1", "STEEL")
        );
        List<SupportDto> supports = List.of(
                new SupportDto("J1", "PINNED"),
                new SupportDto("J2", "ROLLER")
        );
        List<LoadDto> loads = Collections.nCopies(loadCount, new LoadDto("J3", 0, -100));
        return new AnalysisRequest(joints, beams, supports, loads, 300);
    }
}
