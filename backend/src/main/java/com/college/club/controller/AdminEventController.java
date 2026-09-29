package com.college.club.controller;

import com.college.club.dto.ApiResponse;
import com.college.club.dto.EventDto;
import com.college.club.dto.EventRequest;
import com.college.club.service.EventService;
import com.college.club.service.SupabaseStorageService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/events")
public class AdminEventController {

    private static final Logger logger = LoggerFactory.getLogger(AdminEventController.class);
    private final EventService eventService;
    private final SupabaseStorageService supabaseStorageService;

    public AdminEventController(EventService eventService, SupabaseStorageService supabaseStorageService) {
        this.eventService = eventService;
        this.supabaseStorageService = supabaseStorageService;
    }

    @GetMapping
    public ResponseEntity<List<EventDto>> getAllEvents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        String safeSearch = (search != null && search.length() > 100) ? search.substring(0, 100) : search;
        String safeCategory = (category != null && category.length() > 100) ? category.substring(0, 100) : category;
        List<EventDto> events = eventService.getAllEvents(safeSearch, safeCategory);
        return ResponseEntity.ok(events);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EventDto>> createEvent(@Valid @RequestBody EventRequest request) {
        EventDto created = eventService.createEvent(request);
        logger.info("SECURITY_AUDIT: EVENT_CREATED eventId={} title='{}'", created.getId(), created.getTitle());
        return new ResponseEntity<>(
                ApiResponse.success("Event created successfully", created),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EventDto>> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequest request) {
        EventDto updated = eventService.updateEvent(id, request);
        logger.info("SECURITY_AUDIT: EVENT_UPDATED eventId={} title='{}'", updated.getId(), updated.getTitle());
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        logger.info("SECURITY_AUDIT: EVENT_DELETED eventId={}", id);
        return ResponseEntity.ok(ApiResponse.success("Event and associated registrations deleted successfully"));
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(@RequestParam("file") MultipartFile file) {
        String imageUrl = supabaseStorageService.uploadImage(file);
        return ResponseEntity.ok(ApiResponse.success("Image uploaded successfully to Supabase Storage", Map.of("imageUrl", imageUrl)));
    }
}
