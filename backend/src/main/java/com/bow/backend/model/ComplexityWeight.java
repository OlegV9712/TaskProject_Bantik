package com.bow.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "complexity_weights")
public class ComplexityWeight {
    @Id
    private String fieldKey;

    @Column(nullable = false)
    private double weight;

    public ComplexityWeight() {}
    public ComplexityWeight(String fieldKey, double weight) {
        this.fieldKey = fieldKey;
        this.weight = weight;
    }
    public String getFieldKey() { return fieldKey; }
    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }
}
