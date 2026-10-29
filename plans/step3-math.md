# Step 3 — Solver Math & Worked Example

## Direct Method of Joints (Simplified)
For a 2D pin-jointed truss:
1. For each free joint, write equilibrium: ΣFx = 0, ΣFy = 0.
2. Unknowns = member axial forces + support reactions.
3. Build matrix A (coefficients) and vector b (loads + reactions terms).
4. Solve A·x = b with Gaussian elimination (partial pivoting).

## Example: Simple Triangular Truss
Joints: J0(0,0), J1(3,0), J2(1.5, 2)
Members: B0 (J0-J1), B1 (J1-J2), B2 (J2-J0)
Supports: Pinned at J0 (Rx, Ry), Roller at J1 (Ry)
Load: 100 N downward at J2

Equilibrium at J2 (free joint):
- Fx: F(B1)·cosθ + F(B2)·cosφ = 0
- Fy: F(B1)·sinθ + F(B2)·sinφ - 100 = 0
With angles from geometry, this becomes 2 equations in 2 unknowns (after solving supports globally).

In full implementation: assemble full A (members + reactions) and solve globally. The current MethodOfJointsSolver provides the interface; full matrix wiring connects to GaussianEliminator.
