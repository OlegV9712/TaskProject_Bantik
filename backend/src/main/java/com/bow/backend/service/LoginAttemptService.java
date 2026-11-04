package com.bow.backend.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int MAX_TRACKED_ADDRESSES = 10_000;

    private final ConcurrentHashMap<String, Attempts> attemptsByAddress = new ConcurrentHashMap<>();

    public synchronized boolean isBlocked(String address) {
        pruneExpired();
        Attempts attempts = attemptsByAddress.get(address);
        return attempts != null && attempts.count >= MAX_ATTEMPTS
                && Instant.now().isBefore(attempts.startedAt.plus(WINDOW));
    }

    public synchronized void recordFailure(String address) {
        pruneExpired();
        Attempts attempts = attemptsByAddress.get(address);
        if (attempts == null || Instant.now().isAfter(attempts.startedAt.plus(WINDOW))) {
            if (attempts == null && attemptsByAddress.size() >= MAX_TRACKED_ADDRESSES) {
                String oldestAddress = attemptsByAddress.entrySet().stream()
                        .min(java.util.Comparator.comparing(entry -> entry.getValue().startedAt))
                        .map(java.util.Map.Entry::getKey)
                        .orElse(null);
                if (oldestAddress != null) attemptsByAddress.remove(oldestAddress);
            }
            attemptsByAddress.put(address, new Attempts(Instant.now(), 1));
            return;
        }
        attempts.count++;
    }

    public synchronized void recordSuccess(String address) {
        attemptsByAddress.remove(address);
    }

    private void pruneExpired() {
        Instant cutoff = Instant.now().minus(WINDOW);
        attemptsByAddress.entrySet().removeIf(entry -> entry.getValue().startedAt.isBefore(cutoff));
    }

    private static final class Attempts {
        private final Instant startedAt;
        private int count;

        private Attempts(Instant startedAt, int count) {
            this.startedAt = startedAt;
            this.count = count;
        }
    }
}
