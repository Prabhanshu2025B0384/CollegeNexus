package com.college.club.service;

import com.college.club.dto.RegistrationDto;
import com.college.club.dto.RegistrationRequest;
import com.college.club.entity.Event;
import com.college.club.entity.Registration;
import com.college.club.exception.DuplicateResourceException;
import com.college.club.exception.ResourceNotFoundException;
import com.college.club.repository.EventRepository;
import com.college.club.repository.RegistrationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private RegistrationService registrationService;

    private Event testEvent;
    private RegistrationRequest validRequest;

    @BeforeEach
    void setUp() {
        testEvent = new Event();
        testEvent.setId(10L);
        testEvent.setTitle("Campus Tech Summit 2026");
        testEvent.setCategory("Technology");
        testEvent.setEventDate(LocalDate.now().plusDays(10));
        testEvent.setMaxCapacity(100);
        testEvent.setRegistrationOpen(true);

        validRequest = new RegistrationRequest();
        validRequest.setName("Test Student");
        validRequest.setEmail("test.student@example.com");
        validRequest.setCollege("ABES Engineering College");
        validRequest.setYear("3rd Year");
        validRequest.setPhone("+91 98765 43210");
    }

    @Test
    @DisplayName("Should successfully register student when under capacity and not duplicate")
    void testRegisterStudentSuccess() {
        when(eventRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(testEvent));
        when(registrationRepository.countByEventId(10L)).thenReturn(50L);
        when(registrationRepository.existsByEventIdAndEmailIgnoreCase(10L, "test.student@example.com")).thenReturn(false);

        Registration savedRegistration = new Registration(
                testEvent,
                validRequest.getName(),
                validRequest.getEmail(),
                validRequest.getCollege(),
                validRequest.getYear(),
                validRequest.getPhone()
        );
        savedRegistration.setId(1001L);

        when(registrationRepository.save(any(Registration.class))).thenReturn(savedRegistration);

        RegistrationDto result = registrationService.registerStudent(10L, validRequest);

        assertNotNull(result);
        assertEquals(1001L, result.getId());
        assertEquals("Campus Tech Summit 2026", result.getEventTitle());
        assertEquals("test.student@example.com", result.getEmail());
        assertEquals("Test Student", result.getName());
        verify(registrationRepository, times(1)).save(any(Registration.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when event does not exist")
    void testRegisterStudentEventNotFound() {
        when(eventRepository.findByIdForUpdate(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                registrationService.registerStudent(999L, validRequest)
        );
    }

    @Test
    @DisplayName("Should throw IllegalStateException when event registration is closed")
    void testRegisterStudentRegistrationClosed() {
        testEvent.setRegistrationOpen(false);
        when(eventRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(testEvent));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                registrationService.registerStudent(10L, validRequest)
        );
        assertTrue(ex.getMessage().contains("currently closed"));
    }

    @Test
    @DisplayName("Should throw IllegalStateException when event reaches max capacity (concurrency boundary)")
    void testRegisterStudentCapacityReached() {
        testEvent.setMaxCapacity(1); // Capacity is 1
        when(eventRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(testEvent));
        when(registrationRepository.countByEventId(10L)).thenReturn(1L); // Already 1 registered

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                registrationService.registerStudent(10L, validRequest)
        );
        assertTrue(ex.getMessage().contains("capacity (1) has been reached"));
        verify(registrationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when student has already registered for the event")
    void testRegisterStudentDuplicateEmail() {
        when(eventRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(testEvent));
        when(registrationRepository.countByEventId(10L)).thenReturn(5L);
        when(registrationRepository.existsByEventIdAndEmailIgnoreCase(10L, "test.student@example.com")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () ->
                registrationService.registerStudent(10L, validRequest)
        );
        assertTrue(ex.getMessage().contains("already exists for this event"));
        verify(registrationRepository, never()).save(any());
    }
}
