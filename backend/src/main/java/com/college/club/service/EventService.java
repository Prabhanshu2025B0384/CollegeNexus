package com.college.club.service;

import com.college.club.config.CacheConfig;
import com.college.club.dto.EventDto;
import com.college.club.dto.EventRequest;
import com.college.club.entity.Event;
import com.college.club.exception.ResourceNotFoundException;
import com.college.club.repository.EventRepository;
import com.college.club.repository.RegistrationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EventService {

    private static final Logger logger = LoggerFactory.getLogger(EventService.class);

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final SupabaseStorageService storageService;

    public EventService(
            EventRepository eventRepository,
            RegistrationRepository registrationRepository,
            SupabaseStorageService storageService) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.storageService = storageService;
    }

    @Transactional(readOnly = true)
    public List<EventDto> getAllEvents(String search, String category) {
        List<Event> events;
        if ((search != null && !search.trim().isEmpty()) || (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("all"))) {
            String cleanCategory = (category != null && !category.equalsIgnoreCase("all")) ? category.trim() : null;
            String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
            if (cleanSearch != null && cleanSearch.length() > 100) cleanSearch = cleanSearch.substring(0, 100);
            if (cleanCategory != null && cleanCategory.length() > 100) cleanCategory = cleanCategory.substring(0, 100);
            events = eventRepository.searchEvents(cleanSearch, cleanCategory);
        } else {
            events = eventRepository.findAllByOrderByEventDateAsc();
        }
        return mapToDtosWithBatchCounts(events);
    }

    @Transactional(readOnly = true)
    public EventDto getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));
        long count = registrationRepository.countByEventId(id);
        return mapToDto(event, count);
    }

    @Cacheable(value = CacheConfig.CACHE_FEATURED_EVENT)
    @Transactional(readOnly = true)
    public EventDto getFeaturedEvent() {
        return eventRepository.findFirstByFeaturedTrueOrderByEventDateAsc()
                .map(event -> {
                    long count = registrationRepository.countByEventId(event.getId());
                    return mapToDto(event, count);
                })
                .orElse(null);
    }

    @Cacheable(value = CacheConfig.CACHE_UPCOMING_EVENTS, key = "#limit")
    @Transactional(readOnly = true)
    public List<EventDto> getUpcomingEvents(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        List<Event> upcoming = eventRepository.findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate.now());
        List<Event> limited = upcoming.stream().limit(safeLimit).collect(Collectors.toList());
        return mapToDtosWithBatchCounts(limited);
    }

    @Cacheable(value = CacheConfig.CACHE_CATEGORIES)
    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return eventRepository.findDistinctCategories();
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @CacheEvict(value = {CacheConfig.CACHE_CATEGORIES, CacheConfig.CACHE_FEATURED_EVENT, CacheConfig.CACHE_UPCOMING_EVENTS}, allEntries = true)
    @Transactional
    public EventDto createEvent(EventRequest request) {
        if (Boolean.TRUE.equals(request.getFeatured())) {
            unmarkExistingFeaturedEvents(null);
        }

        Event event = new Event();
        mapRequestToEntity(request, event);

        Event savedEvent = eventRepository.save(event);
        return mapToDto(savedEvent, 0L);
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @CacheEvict(value = {CacheConfig.CACHE_CATEGORIES, CacheConfig.CACHE_FEATURED_EVENT, CacheConfig.CACHE_UPCOMING_EVENTS}, allEntries = true)
    @Transactional
    public EventDto updateEvent(Long id, EventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));

        String oldImageUrl = event.getImageUrl();
        String newImageUrl = request.getImageUrl();

        if (Boolean.TRUE.equals(request.getFeatured())) {
            unmarkExistingFeaturedEvents(id);
        }

        mapRequestToEntity(request, event);
        Event updatedEvent = eventRepository.save(event);

        // Safe Image Replacement: If image changed, clean up superseded image from S3 storage
        if (oldImageUrl != null && !oldImageUrl.trim().isEmpty() && !oldImageUrl.equals(newImageUrl)) {
            try {
                storageService.deleteImage(oldImageUrl);
                logger.info("SECURITY_AUDIT: EVENT_IMAGE_REPLACED_OLD_DELETED eventId={} oldImageUrl={}", id, oldImageUrl);
            } catch (Exception e) {
                logger.error("Failed to delete superseded event banner from storage on image replacement: {}", e.getMessage());
            }
        }

        long count = registrationRepository.countByEventId(id);
        return mapToDto(updatedEvent, count);
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @CacheEvict(value = {CacheConfig.CACHE_CATEGORIES, CacheConfig.CACHE_FEATURED_EVENT, CacheConfig.CACHE_UPCOMING_EVENTS}, allEntries = true)
    @Transactional
    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));

        // 1. Capture storage object URL before deleting DB record
        String imageUrl = event.getImageUrl();

        // 2. Transactionally delete database record (JPA CascadeType.ALL removes dependent registrations)
        eventRepository.delete(event);
        eventRepository.flush();

        // 3. Complete Data Lifecycle: Safely remove image object from Supabase S3 bucket
        if (imageUrl != null && !imageUrl.trim().isEmpty()) {
            try {
                boolean deleted = storageService.deleteImage(imageUrl);
                if (deleted) {
                    logger.info("SECURITY_AUDIT: EVENT_DELETE_STORAGE_CLEANED eventId={} imageUrl={}", id, imageUrl);
                } else {
                    logger.warn("SECURITY_AUDIT: EVENT_DELETE_STORAGE_FAILED eventId={} imageUrl={}", id, imageUrl);
                }
            } catch (Exception e) {
                logger.error("Failed to delete event banner from storage on event deletion for eventId={}: {}", id, e.getMessage());
            }
        }
    }

    private void unmarkExistingFeaturedEvents(Long currentId) {
        List<Event> featuredEvents = eventRepository.findByFeaturedTrue();
        for (Event e : featuredEvents) {
            if (currentId == null || !e.getId().equals(currentId)) {
                e.setFeatured(false);
                eventRepository.save(e);
            }
        }
    }

    private void mapRequestToEntity(EventRequest request, Event event) {
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setCategory(request.getCategory());
        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setVenue(request.getVenue());
        event.setFeatured(request.getFeatured() != null ? request.getFeatured() : false);
        event.setRegistrationOpen(request.getRegistrationOpen() != null ? request.getRegistrationOpen() : true);
        event.setImageUrl(request.getImageUrl());
        event.setMaxCapacity(request.getMaxCapacity());
    }

    /**
     * Eliminates N+1 query problem by batch-fetching participant counts in a single query.
     */
    private List<EventDto> mapToDtosWithBatchCounts(List<Event> events) {
        if (events == null || events.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> eventIds = events.stream().map(Event::getId).collect(Collectors.toList());
        Map<Long, Long> countsMap = new HashMap<>();

        try {
            List<Object[]> rawCounts = registrationRepository.countRegistrationsByEventIds(eventIds);
            for (Object[] row : rawCounts) {
                Long evtId = (Long) row[0];
                Long count = (Long) row[1];
                countsMap.put(evtId, count);
            }
        } catch (Exception e) {
            logger.warn("Batch count query failed, falling back gracefully: {}", e.getMessage());
        }

        return events.stream()
                .map(evt -> mapToDto(evt, countsMap.getOrDefault(evt.getId(), 0L)))
                .collect(Collectors.toList());
    }

    public EventDto mapToDto(Event event) {
        long regCount = registrationRepository.countByEventId(event.getId());
        return mapToDto(event, regCount);
    }

    public EventDto mapToDto(Event event, long registrationCount) {
        EventDto dto = new EventDto();
        dto.setId(event.getId());
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setCategory(event.getCategory());
        dto.setEventDate(event.getEventDate());
        dto.setStartTime(event.getStartTime());
        dto.setEndTime(event.getEndTime());
        dto.setVenue(event.getVenue());
        dto.setFeatured(event.getFeatured());
        dto.setRegistrationOpen(event.getRegistrationOpen());
        dto.setImageUrl(event.getImageUrl());
        dto.setMaxCapacity(event.getMaxCapacity());
        dto.setCreatedAt(event.getCreatedAt());
        dto.setUpdatedAt(event.getUpdatedAt());
        dto.setRegistrationCount(registrationCount);
        return dto;
    }
}
