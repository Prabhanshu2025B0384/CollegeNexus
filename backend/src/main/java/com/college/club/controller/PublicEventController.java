package com.college.club.controller;

import com.college.club.dto.EventDto;
import com.college.club.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class PublicEventController {

    private final EventService eventService;

    public PublicEventController(EventService eventService) {
        this.eventService = eventService;
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

    @GetMapping("/{id}")
    public ResponseEntity<EventDto> getEventById(@PathVariable Long id) {
        EventDto event = eventService.getEventById(id);
        return ResponseEntity.ok(event);
    }

    @GetMapping("/featured")
    public ResponseEntity<EventDto> getFeaturedEvent() {
        EventDto event = eventService.getFeaturedEvent();
        if (event == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(event);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<EventDto>> getUpcomingEvents(
            @RequestParam(defaultValue = "6") int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50); // Bounded between 1 and 50
        List<EventDto> events = eventService.getUpcomingEvents(safeLimit);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = eventService.getCategories();
        return ResponseEntity.ok(categories);
    }
}
