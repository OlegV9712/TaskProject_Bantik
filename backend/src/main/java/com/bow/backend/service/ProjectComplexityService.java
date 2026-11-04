package com.bow.backend.service;

import com.bow.backend.repository.ComplexityWeightRepository;
import com.bow.backend.model.ComplexityWeight;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ProjectComplexityService {
    private static final Set<String> IGNORED_VALUES = Set.of("", "нет", "не требуется", "false", "0");

    private final ComplexityWeightRepository weights;

    public ProjectComplexityService(ComplexityWeightRepository weights) {
        this.weights = weights;
    }

    public double calculate(Map<String, Object> details) {
        Map<String, Double> configuredWeights = new LinkedHashMap<>();
        for (ComplexityWeight weight : weights.findAll()) {
            configuredWeights.put(weight.getFieldKey(), weight.getWeight());
        }
        return sum(details, "", configuredWeights);
    }

    private double sum(Object value, String path, Map<String, Double> configuredWeights) {
        if (value instanceof Map<?, ?> map) {
            double total = 0;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                String key = path.isEmpty() ? String.valueOf(entry.getKey()) : path + "." + entry.getKey();
                total += sum(entry.getValue(), key, configuredWeights);
            }
            return total;
        }
        if (value instanceof Iterable<?> values) {
            double total = 0;
            for (Object item : values) total += sum(item, path, configuredWeights);
            return total;
        }
        if (value instanceof Boolean checked) {
            return checked ? configuredWeights.getOrDefault(path, 1.0) : 0;
        }
        if (value == null || IGNORED_VALUES.contains(String.valueOf(value).trim().toLowerCase(Locale.ROOT))) return 0;
        return configuredWeights.getOrDefault(path, 1.0);
    }
}
