# Step 4 — REST API Skeleton

- DTO package: `AnalysisRequest`, `AnalysisResponse`, `MemberResultDto`, `ReactionDto`, `SummaryDto`
- Controller: `AnalysisController` (`POST /api/analyze`) returns `ResponseEntity`
- Endpoint tested with `curl` or PowerShell; returns JSON.
- No business logic in controllers (calls service layer in future steps).
