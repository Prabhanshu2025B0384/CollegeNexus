package com.college.club.service;

import com.college.club.dto.DashboardStatsDto;
import com.college.club.dto.EventDto;
import com.college.club.repository.EventRepository;
import com.college.club.repository.RegistrationRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class DashboardService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final EventService eventService;

    public DashboardService(
            EventRepository eventRepository,
            RegistrationRepository registrationRepository,
            EventService eventService) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.eventService = eventService;
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        long totalEvents = eventRepository.count();
        long upcomingEvents = eventRepository.countByEventDateGreaterThanEqual(LocalDate.now());
        long totalRegistrations = registrationRepository.count();
        EventDto featuredEvent = eventService.getFeaturedEvent();

        return new DashboardStatsDto(totalEvents, upcomingEvents, totalRegistrations, featuredEvent);
    }
}
