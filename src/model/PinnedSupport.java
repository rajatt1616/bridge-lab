package model;

/** Pinned support: 2 reactions (Rx, Ry). Demonstrates concrete inheritance. */
public class PinnedSupport extends Support {
    public PinnedSupport(Joint joint) {
        super(joint);
    }

    @Override
    public int reactionCount() { return 2; }

    @Override
    public String getType() { return "Pinned"; }
}
