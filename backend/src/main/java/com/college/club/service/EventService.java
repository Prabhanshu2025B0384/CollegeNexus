package com.college.club.service;

import com.college.club.dto.EventDto;
import com.college.club.dto.EventRequest;
import com.college.club.entity.Event;
import com.college.club.exception.ResourceNotFoundException;
import com.college.club.repository.EventRepository;
import com.college.club.repository.RegistrationRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    public EventService(EventRepository eventRepository, RegistrationRepository registrationRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
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
        return events.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EventDto getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));
        return mapToDto(event);
    }

    @Transactional(readOnly = true)
    public EventDto getFeaturedEvent() {
        return eventRepository.findFirstByFeaturedTrueOrderByEventDateAsc()
                .map(this::mapToDto)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<EventDto> getUpcomingEvents(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        List<Event> upcoming = eventRepository.findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate.now());
        return upcoming.stream()
                .limit(safeLimit)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return eventRepository.findDistinctCategories();
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public EventDto createEvent(EventRequest request) {
        // If this event is marked as featured, optionally reset other featured events to keep a primary featured
        if (Boolean.TRUE.equals(request.getFeatured())) {
            unmarkExistingFeaturedEvents(null);
        }

        Event event = new Event();
        mapRequestToEntity(request, event);

        Event savedEvent = eventRepository.save(event);
        return mapToDto(savedEvent);
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public EventDto updateEvent(Long id, EventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));

        if (Boolean.TRUE.equals(request.getFeatured())) {
            unmarkExistingFeaturedEvents(id);
        }

        mapRequestToEntity(request, event);
        Event updatedEvent = eventRepository.save(event);
        return mapToDto(updatedEvent);
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));
        // JPA CascadeType.ALL on Event.registrations will safely delete associated registrations
        eventRepository.delete(event);
    }

    private void unmarkExistingFeaturedEvents(Long currentId) {
        List<Event> events = eventRepository.findAll();
        for (Event e : events) {
            if (Boolean.TRUE.equals(e.getFeatured()) && (currentId == null || !e.getId().equals(currentId))) {
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

    public EventDto mapToDto(Event event) {
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

        long regCount = registrationRepository.countByEventId(event.getId());
        dto.setRegistrationCount(regCount);

        return dto;
    }
}
