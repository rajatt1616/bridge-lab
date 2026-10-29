package com.bridgelab.web;

import com.bridgelab.dto.AnalysisRequest;
import com.bridgelab.dto.AnalysisResponse;
import com.bridgelab.service.AnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AnalysisController {

    private final AnalysisService service = new AnalysisService();

    @PostMapping("/analyze")
    public ResponseEntity<AnalysisResponse> analyze(@RequestBody(required = false) AnalysisRequest request) {
        return ResponseEntity.ok(service.analyze(request));
    }
}
