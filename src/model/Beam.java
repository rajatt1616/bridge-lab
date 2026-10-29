package model;

/** Concrete beam member with configurable max force and material. Demonstrates inheritance and polymorphism. */
public class Beam extends Member {
    private final double maxForce; // absolute limit
    private final Material material;

    public Beam(int id, Joint jointA, Joint jointB, double maxForce, Material material) {
        super(id, jointA, jointB);
        if (maxForce <= 0) throw new IllegalArgumentException("maxForce must be positive");
        this.maxForce = maxForce;
        this.material = material;
    }

    public Material getMaterial() { return material; }
    public double getMaxForce() { return maxForce; }

    @Override
    public boolean isOverloaded() {
        return Math.abs(force) > maxForce;
    }

    @Override
    protected void updateStatus() {
        if (force == 0) {
            status = "Zero-force";
        } else if (isOverloaded()) {
            status = "Overload";
        } else if (force > 0) {
            status = "Tension";
        } else {
            status = "Compression";
        }
    }

    @Override
    public String toString() {
        return String.format("Beam(id=%d, len=%.2f, force=%.2f, status=%s, mat=%s)",
                id, length(), force, status, material.getName());
    }
}
