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

    @Test
    @DisplayName("Parameterized constructor initializes all fields and isConfigured is true")
    void testParameterizedConstructor() {
        SupabaseStorageService customService = new SupabaseStorageService("https://project.supabase.co", "test-key", "test-bucket");
        assertTrue(customService.isConfigured());
    }

    @Test
    @DisplayName("Should detect and allow valid JPEG magic bytes")
    void testValidJpegDetection() {
        storageService = new SupabaseStorageService("https://mock.supabase.co", "test-key", "SDMS");
        // Valid JPEG header: FF D8 FF E0 00 10 4A 46 49 46 00 01
        byte[] jpegBytes = new byte[]{ (byte)0xFF, (byte)0xD8, (byte)0xFF, (byte)0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01 };
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", jpegBytes);
        // Will attempt HTTP request to mock url and fail with network/mock error, but pass validation
        Exception ex = assertThrows(IllegalStateException.class, () -> storageService.uploadImage(file));
        assertFalse(ex.getMessage().contains("Invalid file"));
    }

    @Test
    @DisplayName("Should detect and allow valid PNG magic bytes")
    void testValidPngDetection() {
        storageService = new SupabaseStorageService("https://mock.supabase.co", "test-key", "SDMS");
        // Valid PNG header: 89 50 4E 47 0D 0A 1A 0A 00 00 00 0D
        byte[] pngBytes = new byte[]{ (byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", pngBytes);
        Exception ex = assertThrows(IllegalStateException.class, () -> storageService.uploadImage(file));
        assertFalse(ex.getMessage().contains("Invalid file"));
    }

    @Test
    @DisplayName("Should detect and allow valid WebP magic bytes")
    void testValidWebpDetection() {
        storageService = new SupabaseStorageService("https://mock.supabase.co", "test-key", "SDMS");
        // Valid WebP header: 'RIFF' + 4 bytes size + 'WEBP'
        byte[] webpBytes = new byte[]{ 'R', 'I', 'F', 'F', 0x20, 0x00, 0x00, 0x00, 'W', 'E', 'B', 'P' };
        MockMultipartFile file = new MockMultipartFile("file", "photo.webp", "image/webp", webpBytes);
        Exception ex = assertThrows(IllegalStateException.class, () -> storageService.uploadImage(file));
        assertFalse(ex.getMessage().contains("Invalid file"));
    }

    @Test
    @DisplayName("isJwtToken should identify modern opaque keys as non-JWT")
    void testIsJwtTokenOpaqueKeys() {
        assertFalse(storageService.isJwtToken("sb_secret_abc123456789"));
        assertFalse(storageService.isJwtToken("sb_publishable_abc123456789"));
        assertFalse(storageService.isJwtToken("simple-api-key"));
        assertFalse(storageService.isJwtToken(null));
        assertFalse(storageService.isJwtToken(""));
        assertFalse(storageService.isJwtToken("   "));
        assertFalse(storageService.isJwtToken("part1.part2")); // only 1 dot
    }

    @Test
    @DisplayName("isJwtToken should identify valid Compact JWS JWT tokens")
    void testIsJwtTokenValidJwt() {
        assertTrue(storageService.isJwtToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature123"));
    }
}
