package com.college.club.service;

import com.college.club.dto.AuthRequest;
import com.college.club.dto.AuthResponse;
import com.college.club.entity.User;
import com.college.club.exception.ResourceNotFoundException;
import com.college.club.repository.UserRepository;
import com.college.club.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + request.getUsername()));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return new AuthResponse(token, user.getUsername(), user.getRole());
    }

    @Transactional(readOnly = true)
    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
    }
}
