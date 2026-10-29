package com.bridgelab.web;

import com.bridgelab.service.ComparisonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compare")
public class CompareController {

    private final ComparisonService service = new ComparisonService();

    @PostMapping
    public ResponseEntity<String> compare(@RequestBody String body) {
        return ResponseEntity.ok(service.compare("A", "B"));
    }
}
