package com.bridgelab.service;

import java.util.*;

public class PresetService {
    public Map<String, String> getPresets() {
        Map<String, String> map = new HashMap<>();
        map.put("simple-bridge", "2-span beam bridge with pinned and roller supports");
map.put("warren-truss", "Warren truss with connected triangles");
        map.put("warren", "Warren truss preset");
        return map;
    }
}
