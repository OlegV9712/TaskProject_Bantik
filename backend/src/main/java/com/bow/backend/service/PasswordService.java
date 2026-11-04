package com.bow.backend.service;

import com.bow.backend.model.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class PasswordService {
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    public String encode(String rawPassword) {
        if (!isAcceptableRawPassword(rawPassword)) {
            throw new IllegalArgumentException("Password exceeds BCrypt's 72-byte limit");
        }
        return encoder.encode(rawPassword);
    }

    public boolean matchesAndUpgrade(User user, String rawPassword) {
        if (!isAcceptableRawPassword(rawPassword)) return false;
        String storedPassword = user.getPassword();
        if (isEncoded(storedPassword)) return encoder.matches(rawPassword, storedPassword);

        boolean matches = storedPassword != null && MessageDigest.isEqual(
                storedPassword.getBytes(StandardCharsets.UTF_8),
                rawPassword.getBytes(StandardCharsets.UTF_8));
        if (matches) user.setPassword(encode(rawPassword));
        return matches;
    }

    public boolean isEncoded(String value) {
        return value != null && value.startsWith("$2");
    }

    public boolean isAcceptableRawPassword(String value) {
        return value != null && value.getBytes(StandardCharsets.UTF_8).length <= 72;
    }
}
