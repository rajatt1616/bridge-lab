package com.bridgelab.model;

/** Roller support: 1 reaction (Ry, perpendicular to surface). Demonstrates concrete inheritance. */
public class RollerSupport extends Support {
    public RollerSupport(Joint joint) {
        super(joint);
    }

    @Override
    public int reactionCount() { return 1; }

    @Override
    public String getType() { return "Roller"; }
}
