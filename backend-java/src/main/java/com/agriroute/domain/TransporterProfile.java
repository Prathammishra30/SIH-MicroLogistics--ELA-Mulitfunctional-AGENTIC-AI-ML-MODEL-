package com.agriroute.domain;

import java.time.LocalDateTime;

public class TransporterProfile {
    private String id;
    private String userId;
    private String fullName;
    private String vehicleType;
    private String vehicleRegNo;
    private double capacity;
    private String operatingRegion;
    private String phone;
    private LocalDateTime createdAt;

    public TransporterProfile() {
        this.createdAt = LocalDateTime.now();
    }

    public TransporterProfile(String id, String userId, String fullName, String vehicleType, String vehicleRegNo, double capacity, String operatingRegion, String phone) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.vehicleType = vehicleType;
        this.vehicleRegNo = vehicleRegNo;
        this.capacity = capacity;
        this.operatingRegion = operatingRegion;
        this.phone = phone;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getVehicleRegNo() { return vehicleRegNo; }
    public void setVehicleRegNo(String vehicleRegNo) { this.vehicleRegNo = vehicleRegNo; }

    public double getCapacity() { return capacity; }
    public void setCapacity(double capacity) { this.capacity = capacity; }

    public String getOperatingRegion() { return operatingRegion; }
    public void setOperatingRegion(String operatingRegion) { this.operatingRegion = operatingRegion; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
