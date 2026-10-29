package model;

/** Cable member that only carries tension (optional inheritance demo). */
public class CableMember extends Member {
    private final double maxTension;

    public CableMember(int id, Joint jointA, Joint jointB, double maxTension) {
        super(id, jointA, jointB);
        if (maxTension <= 0) throw new IllegalArgumentException("maxTension must be positive");
        this.maxTension = maxTension;
    }

    public double getMaxTension() { return maxTension; }

    @Override
    public boolean isOverloaded() {
        // Cable fails in tension if over max; compression is impossible
        return force > maxTension || force < 0; // negative = compression not allowed
    }

    @Override
    protected void updateStatus() {
        if (force < 0) {
            status = "Invalid (compression)";
        } else if (force == 0) {
            status = "Slack";
        } else if (force > maxTension) {
            status = "Overload";
        } else {
            status = "Tension";
        }
    }
}
