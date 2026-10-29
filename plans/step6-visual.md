# Step 6 — Solver + Visualization Connection

- BridgePanel now accepts AnalysisResult and color-codes members: Gray=zero, Blue=tension, Red=compression, Orange=overload.
- ResultsPanel (table) updates with member forces and status.
- No Swing imports in model/solver; UI updates are observer-like via setAnalysisResult/repaint.
- Color legend shown on canvas.
