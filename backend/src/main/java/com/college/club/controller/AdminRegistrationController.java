package com.college.club.controller;

import com.college.club.dto.ApiResponse;
import com.college.club.dto.RegistrationDto;
import com.college.club.service.RegistrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/registrations")
public class AdminRegistrationController {

    private static final Logger logger = LoggerFactory.getLogger(AdminRegistrationController.class);
    private final RegistrationService registrationService;

    public AdminRegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping
    public ResponseEntity<List<RegistrationDto>> getRegistrations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long eventId,
            @RequestParam(required = false) String year) {
        String safeSearch = (search != null && search.length() > 100) ? search.substring(0, 100) : search;
        String safeYear = (year != null && year.length() > 100) ? year.substring(0, 100) : year;
        List<RegistrationDto> registrations = registrationService.getRegistrations(safeSearch, eventId, safeYear);
        return ResponseEntity.ok(registrations);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRegistration(@PathVariable Long id) {
        registrationService.deleteRegistration(id);
        logger.info("SECURITY_AUDIT: REGISTRATION_DELETED registrationId={}", id);
        return ResponseEntity.ok(ApiResponse.success("Registration deleted successfully"));
    }
}
