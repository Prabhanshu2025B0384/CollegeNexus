package com.college.club.controller;

import com.college.club.dto.ApiResponse;
import com.college.club.dto.RegistrationDto;
import com.college.club.dto.RegistrationRequest;
import com.college.club.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
public class PublicRegistrationController {

    private final RegistrationService registrationService;

    public PublicRegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/{eventId}/registrations")
    public ResponseEntity<ApiResponse<RegistrationDto>> registerForEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody RegistrationRequest request) {
        RegistrationDto registration = registrationService.registerStudent(eventId, request);
        return new ResponseEntity<>(
                ApiResponse.success("Registration successful! You have secured your spot.", registration),
                HttpStatus.CREATED
        );
    }
}
