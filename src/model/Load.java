package model;

/** Point load applied at a joint. Demonstrates encapsulation. */
public class Load {
    private final Joint joint;
    private double fx; // positive right
    private double fy; // positive up (usually negative for downward weight)

    public Load(Joint joint, double fx, double fy) {
        if (joint == null) throw new IllegalArgumentException("Load joint cannot be null");
        this.joint = joint;
        this.fx = fx;
        this.fy = fy;
    }

    public Joint getJoint() { return joint; }
    public double getFx() { return fx; }
    public double getFy() { return fy; }

    public void setFx(double fx) { this.fx = fx; }
    public void setFy(double fy) { this.fy = fy; }

    public double magnitude() {
        return Math.sqrt(fx * fx + fy * fy);
    }

    @Override
    public String toString() {
        return String.format("Load(joint=%d, fx=%.2f, fy=%.2f)", joint.getId(), fx, fy);
    }
}
