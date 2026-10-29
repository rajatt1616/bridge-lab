package com.bridgelab.solver;

import java.util.*;

/** Result of structural analysis. Demonstrates data holder and polymorphism with status flags. */
public class AnalysisResult {
    private final Map<Integer, Double> memberForces = new HashMap<>(); // member id -> force
    private final Map<String, Double> reactions = new HashMap<>(); // descriptive key -> value
    private final List<String> warnings = new ArrayList<>();
    private boolean stable = false;
    private boolean solved = false;

    public void setMemberForce(int memberId, double force) { memberForces.put(memberId, force); }
    public void setReaction(String key, double value) { reactions.put(key, value); }
    public void addWarning(String w) { warnings.add(w); }
    public void setStable(boolean b) { stable = b; }
    public void setSolved(boolean b) { solved = b; }

    public Map<Integer, Double> getMemberForces() { return Collections.unmodifiableMap(memberForces); }
    public Map<String, Double> getReactions() { return Collections.unmodifiableMap(reactions); }
    public List<String> getWarnings() { return Collections.unmodifiableList(warnings); }
    public boolean isStable() { return stable; }
    public boolean isSolved() { return solved; }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("AnalysisResult(solved=").append(solved).append(", stable=").append(stable).append(")\n");
        for (Map.Entry<Integer, Double> e : memberForces.entrySet()) {
            sb.append(String.format("  Member %d: force = %.2f\n", e.getKey(), e.getValue()));
        }
        if (!warnings.isEmpty()) {
            sb.append("Warnings:\n");
            for (String w : warnings) sb.append("  ").append(w).append("\n");
        }
        return sb.toString();
    }
}
