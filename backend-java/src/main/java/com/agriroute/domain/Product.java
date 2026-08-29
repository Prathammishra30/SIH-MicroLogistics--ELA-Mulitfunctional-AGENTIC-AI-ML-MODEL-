package com.agriroute.domain;

import java.time.LocalDateTime;

public class Product {
    private String id;
    private String farmerId;
    private String name;
    private String category;
    private double quantity;
    private String grade;
    private String status;
    private LocalDateTime createdAt;

    public Product() {
        this.createdAt = LocalDateTime.now();
        this.status = "AVAILABLE";
    }

    public Product(String id, String farmerId, String name, String category, double quantity, String grade) {
        this.id = id;
        this.farmerId = farmerId;
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.grade = grade;
        this.status = "AVAILABLE";
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFarmerId() { return farmerId; }
    public void setFarmerId(String farmerId) { this.farmerId = farmerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = quantity; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
