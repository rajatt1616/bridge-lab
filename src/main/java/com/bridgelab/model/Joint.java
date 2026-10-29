package com.bridgelab.model;

/** Encapsulated 2D joint (node) with validated setters. */
public class Joint {
    private final int id;
    private double x;
    private double y;

    public Joint(int id, double x, double y) {
        if (id < 0) throw new IllegalArgumentException("Joint id must be non-negative");
        this.id = id;
        this.x = x;
        this.y = y;
    }

    public int getId() { return id; }
    public double getX() { return x; }
    public double getY() { return y; }

    public void setX(double x) { this.x = x; }
    public void setY(double y) { this.y = y; }

    public double distanceTo(Joint other) {
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    @Override
    public String toString() {
        return String.format("Joint(id=%d, x=%.2f, y=%.2f)", id, x, y);
    }
}
