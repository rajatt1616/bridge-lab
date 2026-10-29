# BridgeLab Web — Final README

## Run
```
mvn spring-boot:run
# URL: http://localhost:8080
```

## Features
- Canvas: geometric bridge drawing with grid, terrain, supports, loads.
- Modes: Select, Add Joint, Add Beam, Support, Load, Analyze, Run Test.
- REST: POST /api/analyze returns per-member tension/compression forces, support reactions, total load, capacity, utilization and pass/fail. GET /api/presets and POST /api/compare are placeholders.
- Solver: method of joints. Builds the 2J equilibrium system, solves reactions and member forces with Gaussian elimination, and falls back to a damped least-squares estimate for statically indeterminate or near-singular cases. Detects mechanisms and missing supports.
- Frontend: responsive layout, keyboard shortcuts, drag joint, per-member stress colors (tension blue, compression red, overload amber), dynamic legend and stress utilization meter.
- Loads: clicking Load at the same joint adds 100 kN to that joint; the canvas label shows the combined load.
- Run Test: passes by driving the car across the bridge; overloaded bridges stop the car at midspan with a red fail banner; unstable or incomplete bridges fail immediately.

## Design (per rules file)
- No decorative gradients/glows/card shadows.
- Hairline dividers, engineering instrument style, monospace numbers.
- Accessible focus outlines and aria-labels.

## Architecture
- Spring Boot 3, Java 17, Maven.
- Model/solver framework-free; web layer separate.
- `BridgeMapper` converts request DTOs to the domain model, inverts the canvas Y axis, and filters the connected structural component.
- Vanilla JS (no React) for the frontend.

## Assumptions and Limitations
- The solver is a method-of-joints truss analysis. Member forces are axial only; bending moments, buckling and self-weight are not modelled.
- Statically indeterminate structures fall back to a damped least-squares estimate, so those forces are approximate rather than exact.
- Capacity is rated per member from the steel yield capacity (250 kN); the governing (highest utilization) member sets the bridge pass/fail. Utilization of 100% or more is failure.
- Only the connected component containing the supports is analyzed; disconnected members are ignored.
- GET /api/presets and POST /api/compare are placeholder endpoints, and the browser owns all editing state (no server-side save/load).
- The desktop sources under `src/model`, `src/solver` and `src/ui` still contain the older placeholder solver.
- Educational simulation only; not certified engineering.
- Moving load simulation uses interpolation with an aggregate capacity check, not a full per-position solve.
