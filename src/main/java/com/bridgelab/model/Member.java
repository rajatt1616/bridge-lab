package com.bridgelab.model;

/** Abstract base class for all structural members (abstraction). */
public abstract class Member {
    protected final int id;
    protected final Joint jointA;
    protected final Joint jointB;
    protected double force; // positive = tension, negative = compression
    protected String status = "Unknown";

    public Member(int id, Joint jointA, Joint jointB) {
        if (jointA == jointB) throw new IllegalArgumentException("Beam cannot connect a joint to itself");
        if (jointA == null || jointB == null) throw new IllegalArgumentException("Joints cannot be null");
        this.id = id;
        this.jointA = jointA;
        this.jointB = jointB;
    }

    public int getId() { return id; }
    public Joint getJointA() { return jointA; }
    public Joint getJointB() { return jointB; }
    public double getForce() { return force; }
    public String getStatus() { return status; }

    public void setForce(double force) {
        this.force = force;
        updateStatus();
    }

    /** Length computed from joint coordinates. */
    public double length() {
        return jointA.distanceTo(jointB);
    }

    /** Polymorphic overload check. */
    public abstract boolean isOverloaded();

    protected abstract void updateStatus();

    @Override
    public String toString() {
        return String.format("Member(id=%d, force=%.2f, status=%s)", id, force, status);
    }
}
