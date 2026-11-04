package com.bow.backend.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.LinkedHashMap;
import java.util.Map;

@Converter
public class JsonMapConverter implements AttributeConverter<Map<String, Object>, String> {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<LinkedHashMap<String, Object>> MAP_TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(Map<String, Object> value) {
        try {
            return MAPPER.writeValueAsString(value == null ? Map.of() : value);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Unable to serialize project data", exception);
        }
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(String value) {
        if (value == null || value.isBlank()) return new LinkedHashMap<>();
        try {
            return MAPPER.readValue(value, MAP_TYPE);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Unable to read stored project data", exception);
        }
    }
}
