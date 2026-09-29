package com.college.club.service;

import com.college.club.dto.EventDto;
import com.college.club.dto.EventRequest;
import com.college.club.entity.Event;
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
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private SupabaseStorageService storageService;

    @InjectMocks
    private EventService eventService;

    private Event testEvent;

    @BeforeEach
    void setUp() {
        testEvent = new Event();
        testEvent.setId(100L);
        testEvent.setTitle("Hackathon 2026");
        testEvent.setDescription("Annual coding contest");
        testEvent.setCategory("Technical");
        testEvent.setEventDate(LocalDate.now().plusDays(5));
        testEvent.setStartTime("10:00 AM");
        testEvent.setEndTime("06:00 PM");
        testEvent.setVenue("Auditorium A");
        testEvent.setImageUrl("https://vshsmnrzeusimlcemzhc.supabase.co/storage/v1/object/public/SDMS/events/hackathon.jpg");
    }

    @Test
    @DisplayName("deleteEvent should transactionally delete event and clean up associated image from S3 storage")
    void testDeleteEventCleansStorage() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(testEvent));
        when(storageService.deleteImage("https://vshsmnrzeusimlcemzhc.supabase.co/storage/v1/object/public/SDMS/events/hackathon.jpg"))
                .thenReturn(true);

        eventService.deleteEvent(100L);

        verify(eventRepository, times(1)).delete(testEvent);
        verify(eventRepository, times(1)).flush();
        verify(storageService, times(1)).deleteImage("https://vshsmnrzeusimlcemzhc.supabase.co/storage/v1/object/public/SDMS/events/hackathon.jpg");
    }

    @Test
    @DisplayName("updateEvent should clean up previous image when image URL is replaced")
    void testUpdateEventDeletesOldImage() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(testEvent));
        when(eventRepository.save(any(Event.class))).thenReturn(testEvent);
        when(registrationRepository.countByEventId(100L)).thenReturn(5L);

        EventRequest updateRequest = new EventRequest();
        updateRequest.setTitle("Hackathon 2026 Updated");
        updateRequest.setDescription("Updated desc");
        updateRequest.setCategory("Technical");
        updateRequest.setEventDate(LocalDate.now().plusDays(5));
        updateRequest.setStartTime("10:00 AM");
        updateRequest.setEndTime("06:00 PM");
        updateRequest.setVenue("Auditorium A");
        updateRequest.setImageUrl("https://vshsmnrzeusimlcemzhc.supabase.co/storage/v1/object/public/SDMS/events/new-banner.jpg");

        EventDto result = eventService.updateEvent(100L, updateRequest);

        assertNotNull(result);
        verify(storageService, times(1)).deleteImage("https://vshsmnrzeusimlcemzhc.supabase.co/storage/v1/object/public/SDMS/events/hackathon.jpg");
    }

    @Test
    @DisplayName("getAllEvents should use batch count query to eliminate N+1 queries")
    void testGetAllEventsBatchCounts() {
        Event event1 = new Event();
        event1.setId(1L);
        event1.setTitle("Event 1");
        event1.setDescription("Desc 1");
        event1.setCategory("Tech");
        event1.setEventDate(LocalDate.now());
        event1.setStartTime("10:00");
        event1.setEndTime("12:00");
        event1.setVenue("Room 1");

        Event event2 = new Event();
        event2.setId(2L);
        event2.setTitle("Event 2");
        event2.setDescription("Desc 2");
        event2.setCategory("Tech");
        event2.setEventDate(LocalDate.now());
        event2.setStartTime("10:00");
        event2.setEndTime("12:00");
        event2.setVenue("Room 2");

        when(eventRepository.findAllByOrderByEventDateAsc()).thenReturn(List.of(event1, event2));
        List<Object[]> mockCounts = List.of(
                new Object[]{1L, 12L},
                new Object[]{2L, 25L}
        );
        when(registrationRepository.countRegistrationsByEventIds(anyList())).thenReturn(mockCounts);

        List<EventDto> result = eventService.getAllEvents(null, null);

        assertEquals(2, result.size());
        assertEquals(12L, result.get(0).getRegistrationCount());
        assertEquals(25L, result.get(1).getRegistrationCount());
        // Verify batch count was called once instead of countByEventId per row
        verify(registrationRepository, times(1)).countRegistrationsByEventIds(anyList());
        verify(registrationRepository, never()).countByEventId(anyLong());
    }
}
