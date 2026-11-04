package com.bow.backend.controller;

import com.bow.backend.model.User;
import com.bow.backend.repository.UserRepository;
import com.bow.backend.service.LoginAttemptService;
import com.bow.backend.service.PasswordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordService passwordService;
    private final LoginAttemptService loginAttempts;

    public AuthController(UserRepository userRepo, PasswordService passwordService, LoginAttemptService loginAttempts) {
        this.userRepo = userRepo;
        this.passwordService = passwordService;
        this.loginAttempts = loginAttempts;
    }

    public static class LoginRequest { public String email; public String password; }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody(required = false) LoginRequest req, HttpServletRequest request) {
        String address = request.getRemoteAddr();
        if (loginAttempts.isBlocked(address)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "too_many_login_attempts"));
        }
        boolean malformed = req == null || req.email == null || req.email.isBlank()
                || req.email.length() > 100 || req.password == null || req.password.isEmpty()
                || req.password.length() > 128 || !passwordService.isAcceptableRawPassword(req.password);
        User user = malformed
                ? null : userRepo.findByUsername(req.email.trim()).orElse(null);
        boolean legacyPassword = user != null && !passwordService.isEncoded(user.getPassword());
        if (user == null || malformed || !passwordService.matchesAndUpgrade(user, req.password)) {
            loginAttempts.recordFailure(address);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid_credentials"));
        }

        if (legacyPassword) userRepo.save(user);
        loginAttempts.recordSuccess(address);
        HttpSession previousSession = request.getSession(false);
        if (previousSession != null) previousSession.invalidate();
        HttpSession session = request.getSession(true);
        session.setAttribute("username", user.getUsername());
        session.setAttribute("credentialVersion", user.getCredentialVersion());
        return ResponseEntity.ok(userView(user));
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        String username = session == null ? null : (String) session.getAttribute("username");
        return username == null
                ? ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "unauthenticated"))
                : userRepo.findByUsername(username).map(user -> ResponseEntity.ok(userView(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "unauthenticated")));
    }

    private Map<String, String> userView(User user) {
        return Map.of(
                "username", user.getUsername(),
                "role", user.getRole() == null ? "" : user.getRole().getName()
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        if (request.getSession(false) != null) request.getSession(false).invalidate();
        return ResponseEntity.noContent().build();
    }
}
