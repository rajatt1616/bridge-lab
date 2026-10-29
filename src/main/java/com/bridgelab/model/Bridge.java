package com.bridgelab.model;

import java.util.*;

/** Central model container. Demonstrates collections, deep copy, and validation. */
public class Bridge {
    private final List<Joint> joints = new ArrayList<>();
    private final List<Member> members = new ArrayList<>();
    private final List<Support> supports = new ArrayList<>();
    private final List<Load> loads = new ArrayList<>();

    // Deep copy for design comparison (snapshot / memento-like behavior)
    public Bridge deepCopy() {
        Bridge copy = new Bridge();
        // Deep copy joints (new IDs would break references, so map old->new)
        Map<Integer, Joint> idMap = new HashMap<>();
        for (Joint j : joints) {
            Joint cj = new Joint(j.getId(), j.getX(), j.getY());
            copy.joints.add(cj);
            idMap.put(j.getId(), cj);
        }
        // Deep copy members referencing new joints
        for (Member m : members) {
            Joint a = idMap.get(m.getJointA().getId());
            Joint b = idMap.get(m.getJointB().getId());
            Member cm;
            if (m instanceof CableMember) {
                cm = new CableMember(m.getId(), a, b, ((CableMember) m).getMaxTension());
            } else {
                cm = new Beam(m.getId(), a, b, ((Beam) m).getMaxForce(), ((Beam) m).getMaterial());
            }
            copy.members.add(cm);
        }
        // Deep copy supports
        for (Support s : supports) {
            Joint cj = idMap.get(s.getJoint().getId());
            Support cs = (s instanceof PinnedSupport) ? new PinnedSupport(cj) : new RollerSupport(cj);
            copy.supports.add(cs);
        }
        // Deep copy loads
        for (Load l : loads) {
            Joint cj = idMap.get(l.getJoint().getId());
            Load cl = new Load(cj, l.getFx(), l.getFy());
            copy.loads.add(cl);
        }
        return copy;
    }

    // Add/remove methods with basic validation
    public void addJoint(Joint j) {
        if (j == null) throw new IllegalArgumentException("Joint cannot be null");
        if (findJointById(j.getId()) != null) throw new IllegalArgumentException("Duplicate joint id: " + j.getId());
        joints.add(j);
    }

    public void addMember(Member m) {
        if (m == null) throw new IllegalArgumentException("Member cannot be null");
        members.add(m);
    }

    public void addSupport(Support s) {
        if (s == null) throw new IllegalArgumentException("Support cannot be null");
        supports.add(s);
    }

    public void addLoad(Load l) {
        if (l == null) throw new IllegalArgumentException("Load cannot be null");
        loads.add(l);
    }

    public Joint findJointById(int id) {
        for (Joint j : joints) if (j.getId() == id) return j;
        return null;
    }

    // Getters
    public List<Joint> getJoints() { return new ArrayList<>(joints); }
    public List<Member> getMembers() { return new ArrayList<>(members); }
    public List<Support> getSupports() { return new ArrayList<>(supports); }
    public List<Load> getLoads() { return new ArrayList<>(loads); }

    public boolean isStableEstimate() {
        // Rough stability: members + reactions should be >= 2 * free joints for 2D truss
        int reactions = supports.stream().mapToInt(Support::reactionCount).sum();
        int freeJoints = joints.size();
        int membersCount = members.size();
        return (membersCount + reactions) >= (2 * freeJoints);
    }

    @Override
    public String toString() {
        return String.format("Bridge(joints=%d, members=%d, supports=%d, loads=%d, stable=%b)",
                joints.size(), members.size(), supports.size(), loads.size(), isStableEstimate());
    }
}
