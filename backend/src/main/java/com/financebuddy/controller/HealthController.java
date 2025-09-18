package com.financebuddy.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("")
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "FinanceBuddy API is running");
        return response;
    }

    @GetMapping("/favicon.ico")
    public void favicon() {
        // Return empty response for favicon requests
    }

    @GetMapping("/manifest.json")
    public Map<String, Object> manifest() {
        Map<String, Object> manifest = new HashMap<>();
        manifest.put("name", "FinanceBuddy");
        manifest.put("short_name", "FinanceBuddy");
        manifest.put("start_url", "/");
        manifest.put("display", "standalone");
        manifest.put("theme_color", "#1976d2");
        manifest.put("background_color", "#ffffff");
        return manifest;
    }
}
