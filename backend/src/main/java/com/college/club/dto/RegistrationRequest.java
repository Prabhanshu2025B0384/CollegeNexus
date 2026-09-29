package com.college.club.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegistrationRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 150, message = "Name must be between 2 and 150 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    @NotBlank(message = "College is required")
    @Size(min = 2, max = 200, message = "College must be between 2 and 200 characters")
    private String college;

    @NotBlank(message = "Year is required")
    @Size(max = 50, message = "Year must not exceed 50 characters")
    private String year;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9+()\\-\\s]{7,20}$", message = "Please provide a valid phone number (7-20 digits)")
    private String phone;

    public RegistrationRequest() {
    }

    public RegistrationRequest(String name, String email, String college, String year, String phone) {
        this.name = name;
        this.email = email;
        this.college = college;
        this.year = year;
        this.phone = phone;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCollege() {
        return college;
    }

    public void setCollege(String college) {
        this.college = college;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
