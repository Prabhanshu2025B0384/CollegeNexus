package com.college.club.service;

import com.college.club.dto.RegistrationDto;
import com.college.club.dto.RegistrationRequest;
import com.college.club.entity.Event;
import com.college.club.entity.Registration;
import com.college.club.exception.DuplicateResourceException;
import com.college.club.exception.ResourceNotFoundException;
import com.college.club.repository.EventRepository;
import com.college.club.repository.RegistrationRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;

    public RegistrationService(RegistrationRepository registrationRepository, EventRepository eventRepository) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional
    public RegistrationDto registerStudent(Long eventId, RegistrationRequest request) {
        // Acquire pessimistic write lock on Event row to prevent concurrent capacity oversubscription
        Event event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));

        if (Boolean.FALSE.equals(event.getRegistrationOpen())) {
            throw new IllegalStateException("Registration is currently closed for the event: " + event.getTitle());
        }

        // Check if registration capacity reached under locked transaction
        if (event.getMaxCapacity() != null && event.getMaxCapacity() > 0) {
            long currentCount = registrationRepository.countByEventId(eventId);
            if (currentCount >= event.getMaxCapacity()) {
                throw new IllegalStateException("Event registration capacity (" + event.getMaxCapacity() + ") has been reached.");
            }
        }

        // Prevent duplicate registration for the same event with the same email
        if (registrationRepository.existsByEventIdAndEmailIgnoreCase(eventId, request.getEmail().trim())) {
            throw new DuplicateResourceException("A registration with email '" + request.getEmail() + "' already exists for this event.");
        }

        Registration registration = new Registration(
                event,
                request.getName().trim(),
                request.getEmail().trim().toLowerCase(),
                request.getCollege().trim(),
                request.getYear().trim(),
                request.getPhone().trim()
        );

        Registration saved = registrationRepository.save(registration);
        return mapToDto(saved);
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public List<RegistrationDto> getRegistrations(String search, Long eventId, String year) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanYear = (year != null && !year.trim().isEmpty() && !year.equalsIgnoreCase("all")) ? year.trim() : null;

        List<Registration> registrations = registrationRepository.searchRegistrations(cleanSearch, eventId, cleanYear);
        return registrations.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public List<RegistrationDto> getRegistrationsByEvent(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found with ID: " + eventId);
        }
        return registrationRepository.findByEventIdOrderByRegisteredAtDesc(eventId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public void deleteRegistration(Long id) {
        Registration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found with ID: " + id));
        registrationRepository.delete(registration);
    }

    private RegistrationDto mapToDto(Registration reg) {
        RegistrationDto dto = new RegistrationDto();
        dto.setId(reg.getId());
        dto.setEventId(reg.getEvent().getId());
        dto.setEventTitle(reg.getEvent().getTitle());
        dto.setEventCategory(reg.getEvent().getCategory());
        dto.setName(reg.getName());
        dto.setEmail(reg.getEmail());
        dto.setCollege(reg.getCollege());
        dto.setYear(reg.getYear());
        dto.setPhone(reg.getPhone());
        dto.setRegisteredAt(reg.getRegisteredAt());
        return dto;
    }
}
