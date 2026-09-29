package com.college.club.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class SupabaseStorageServiceTest {

    private SupabaseStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new SupabaseStorageService();
    }

    @Test
    @DisplayName("Should detect when Supabase storage is not configured")
    void testIsConfiguredFalseWhenMissing() {
        assertFalse(storageService.isConfigured());

        ReflectionTestUtils.setField(storageService, "supabaseUrl", "https://xyz.supabase.co");
        ReflectionTestUtils.setField(storageService, "supabaseServiceKey", "");
        assertFalse(storageService.isConfigured());
    }

    @Test
    @DisplayName("Should detect when Supabase storage is properly configured")
    void testIsConfiguredTrueWhenSet() {
        ReflectionTestUtils.setField(storageService, "supabaseUrl", "https://xyz.supabase.co");
        ReflectionTestUtils.setField(storageService, "supabaseServiceKey", "mock-service-role-key");
        assertTrue(storageService.isConfigured());
    }

    @Test
    @DisplayName("Should reject upload when storage service is not configured")
    void testUploadWhenNotConfigured() {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[]{ (byte)0xFF, (byte)0xD8, (byte)0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0 });
        assertThrows(IllegalStateException.class, () -> storageService.uploadImage(file));
    }

    @Test
    @DisplayName("Should reject empty or null files")
    void testUploadEmptyFile() {
        ReflectionTestUtils.setField(storageService, "supabaseUrl", "https://xyz.supabase.co");
        ReflectionTestUtils.setField(storageService, "supabaseServiceKey", "mock-key");

        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[0]);
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(emptyFile));
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(null));
    }

    @Test
    @DisplayName("Should reject oversized files (> 5MB)")
    void testUploadOversizedFile() {
        ReflectionTestUtils.setField(storageService, "supabaseUrl", "https://xyz.supabase.co");
        ReflectionTestUtils.setField(storageService, "supabaseServiceKey", "mock-key");

        // 5MB + 1 byte
        byte[] oversizedBytes = new byte[(int) (5 * 1024 * 1024 + 1)];
        MockMultipartFile largeFile = new MockMultipartFile("file", "large.png", "image/png", oversizedBytes);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(largeFile));
        assertTrue(ex.getMessage().contains("exceeds maximum allowed limit"));
    }

    @Test
    @DisplayName("Should reject SVG / HTML / scripts spoofed as image files")
    void testRejectSpoofedImageFiles() {
        ReflectionTestUtils.setField(storageService, "supabaseUrl", "https://xyz.supabase.co");
        ReflectionTestUtils.setField(storageService, "supabaseServiceKey", "mock-key");

        // SVG disguised as PNG
        String svgContent = "<svg xmlns='http://www.w3.org/2000/svg'><script>alert('xss')</script></svg>";
        MockMultipartFile svgFile = new MockMultipartFile("file", "badge.png", "image/png", svgContent.getBytes(StandardCharsets.UTF_8));
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(svgFile));

        // HTML disguised as JPG
        String htmlContent = "<!DOCTYPE html><html><body><h1>Fake Image</h1></body></html>";
        MockMultipartFile htmlFile = new MockMultipartFile("file", "banner.jpg", "image/jpeg", htmlContent.getBytes(StandardCharsets.UTF_8));
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(htmlFile));

        // Windows executable / binary header
        byte[] exeBytes = new byte[]{ 0x4D, 0x5A, (byte)0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00 };
        MockMultipartFile exeFile = new MockMultipartFile("file", "virus.jpg", "image/jpeg", exeBytes);
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(exeFile));
    }

    @Test
    @DisplayName("Should reject files smaller than 12 bytes")
    void testRejectTooSmallFiles() {
        ReflectionTestUtils.setField(storageService, "supabaseUrl", "https://xyz.supabase.co");
        ReflectionTestUtils.setField(storageService, "supabaseServiceKey", "mock-key");

        byte[] smallBytes = new byte[]{ (byte)0xFF, (byte)0xD8, (byte)0xFF }; // Only 3 bytes
        MockMultipartFile file = new MockMultipartFile("file", "tiny.jpg", "image/jpeg", smallBytes);
        assertThrows(IllegalArgumentException.class, () -> storageService.uploadImage(file));
    }
}
