package com.college.club.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class EventRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must not exceed 50 characters")
    private String category;

    @NotNull(message = "Event date is required")
    private LocalDate eventDate;

    @NotBlank(message = "Start time is required")
    @Size(max = 30, message = "Start time must not exceed 30 characters")
    private String startTime;

    @NotBlank(message = "End time is required")
    @Size(max = 30, message = "End time must not exceed 30 characters")
    private String endTime;

    @NotBlank(message = "Venue is required")
    @Size(max = 200, message = "Venue must not exceed 200 characters")
    private String venue;

    private Boolean featured = false;

    private Boolean registrationOpen = true;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    @Pattern(regexp = "^(https?://.+)?$", message = "Image URL must be a valid HTTP or HTTPS URL")
    private String imageUrl;

    @Min(value = 1, message = "Maximum capacity must be at least 1")
    @Max(value = 50000, message = "Maximum capacity must not exceed 50,000")
    private Integer maxCapacity;

    public EventRequest() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public Boolean getFeatured() {
        return featured;
    }

    public void setFeatured(Boolean featured) {
        this.featured = featured;
    }

    public Boolean getRegistrationOpen() {
        return registrationOpen;
    }

    public void setRegistrationOpen(Boolean registrationOpen) {
        this.registrationOpen = registrationOpen;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }
}
