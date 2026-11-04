package com.bow.backend.controller;

import com.bow.backend.model.User;
import com.bow.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final UserRepository userRepository;

    public SettingsController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public Map<String,Object> getSettings(@RequestParam(required = false) String username) {
        Map<String,Object> state = new HashMap<>();
        state.put("theme", "pink");
        if (username != null) {
            Optional<User> u = userRepository.findByUsername(username);
            if (u.isPresent()) {
                state.put("username", u.get().getUsername());
                state.put("email", u.get().getUsername() + "@example.com");
                state.put("role", u.get().getRole().getName());
                return state;
            }
        }
        // fallback demo values
        state.put("username", "Котёнок");
        state.put("email", "kitty@example.com");
        state.put("role", "Kotik");
        return state;
    }

    @PutMapping
    public Map<String,Object> updateSettings(@RequestBody Map<String,Object> payload) {
        // saving disabled in dev; return payload merged with demo defaults
        Map<String,Object> state = new HashMap<>();
        state.put("theme", payload.getOrDefault("theme", "pink"));
        state.put("username", payload.getOrDefault("username", "Котёнок"));
        state.put("email", payload.getOrDefault("email", "kitty@example.com"));
        state.put("role", payload.getOrDefault("role", "Kotik"));
        return state;
    }
}
