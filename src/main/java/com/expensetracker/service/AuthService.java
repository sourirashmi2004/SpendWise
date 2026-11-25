package com.expensetracker.service;

import com.expensetracker.dto.AuthDtos.*;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("An account with this email already exists");
        }
        User user = new User(
                request.fullName().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.password()));
        return userRepository.save(user);
    }

    public User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new BadRequestException("User is not authenticated");
        }
        return userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    public UserResponse getSessionStatus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return new UserResponse(false, null, null, null);
        }
        return userRepository.findByEmailIgnoreCase(auth.getName())
                .map(u -> new UserResponse(true, u.getId(), u.getFullName(), u.getEmail()))
                .orElse(new UserResponse(false, null, null, null));
    }

    public UserResponse updateProfile(ProfileUpdateRequest request) {
        User user = requireCurrentUser();
        user.setFullName(request.fullName().trim());
        User saved = userRepository.save(user);
        return new UserResponse(true, saved.getId(), saved.getFullName(), saved.getEmail());
    }
}
