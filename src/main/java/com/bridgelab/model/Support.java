package com.bridgelab.model;

/** Abstract support base showing inheritance and polymorphism with reactionCount(). */
public abstract class Support {
    protected final Joint joint;

    public Support(Joint joint) {
        if (joint == null) throw new IllegalArgumentException("Support joint cannot be null");
        this.joint = joint;
    }

    public Joint getJoint() { return joint; }

    /** Returns number of unknown reaction components. */
    public abstract int reactionCount();

    /** Polymorphic description. */
    public abstract String getType();

    @Override
    public String toString() {
        return String.format("Support(type=%s, joint=%d)", getType(), joint.getId());
    }
}
