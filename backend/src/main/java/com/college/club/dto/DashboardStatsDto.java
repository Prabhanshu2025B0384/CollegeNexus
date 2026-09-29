package com.college.club.dto;

public class DashboardStatsDto {

    private long totalEvents;
    private long upcomingEvents;
    private long totalRegistrations;
    private EventDto featuredEvent;

    public DashboardStatsDto() {
    }

    public DashboardStatsDto(long totalEvents, long upcomingEvents, long totalRegistrations, EventDto featuredEvent) {
        this.totalEvents = totalEvents;
        this.upcomingEvents = upcomingEvents;
        this.totalRegistrations = totalRegistrations;
        this.featuredEvent = featuredEvent;
    }

    public long getTotalEvents() {
        return totalEvents;
    }

    public void setTotalEvents(long totalEvents) {
        this.totalEvents = totalEvents;
    }

    public long getUpcomingEvents() {
        return upcomingEvents;
    }

    public void setUpcomingEvents(long upcomingEvents) {
        this.upcomingEvents = upcomingEvents;
    }

    public long getTotalRegistrations() {
        return totalRegistrations;
    }

    public void setTotalRegistrations(long totalRegistrations) {
        this.totalRegistrations = totalRegistrations;
    }

    public EventDto getFeaturedEvent() {
        return featuredEvent;
    }

    public void setFeaturedEvent(EventDto featuredEvent) {
        this.featuredEvent = featuredEvent;
    }
}
