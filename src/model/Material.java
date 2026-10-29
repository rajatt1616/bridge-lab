package model;

/** Material properties for structural members. Demonstrates enum usage. */
public enum Material {
    STEEL("Steel", 250, 250, 1.2),
    WOOD("Wood", 40, 40, 0.8),
    ALUMINUM("Aluminum", 120, 120, 1.0);

    private final String name;
    private final double maxTension;
    private final double maxCompression;
    private final double costPerUnitLength;

    Material(String name, double maxTension, double maxCompression, double costPerUnitLength) {
        this.name = name;
        this.maxTension = maxTension;
        this.maxCompression = maxCompression;
        this.costPerUnitLength = costPerUnitLength;
    }

    public String getName() { return name; }
    public double getMaxTension() { return maxTension; }
    public double getMaxCompression() { return maxCompression; }
    public double getCostPerUnitLength() { return costPerUnitLength; }
}
