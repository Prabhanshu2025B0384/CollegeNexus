package com.college.club.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class HealthControllerTest {

    @Test
    @DisplayName("Health endpoint returns UP status and service name")
    void testHealthEndpoint() {
        HealthController controller = new HealthController();
        ResponseEntity<Map<String, Object>> response = controller.health();

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("UP", response.getBody().get("status"));
        assertEquals("campus-nexus-api", response.getBody().get("service"));
    }
}
