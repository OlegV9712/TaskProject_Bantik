package com.bow.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "project_fields")
public class ProjectField {
    @Id
    private String fieldKey;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private String type;

    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "text")
    private List<String> options = new ArrayList<>();

    public ProjectField() {}
    public ProjectField(String fieldKey, String label, String type, List<String> options) {
        this.fieldKey = fieldKey;
        this.label = label;
        this.type = type;
        this.options = options == null ? new ArrayList<>() : new ArrayList<>(options);
    }

    public String getFieldKey() { return fieldKey; }
    public String getLabel() { return label; }
    public String getType() { return type; }
    public List<String> getOptions() { return options; }
}
