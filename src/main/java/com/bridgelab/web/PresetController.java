package com.bridgelab.web;

import com.bridgelab.service.PresetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/presets")
public class PresetController {

    private final PresetService service = new PresetService();

    @GetMapping
    public ResponseEntity<Map<String, String>> list() {
        return ResponseEntity.ok(service.getPresets());
    }

    @GetMapping("/{name}")
    public ResponseEntity<String> get(@PathVariable String name) {
        return ResponseEntity.ok("Preset: " + name + " (full bridge JSON loaded from service layer in next step).");
    }
}
