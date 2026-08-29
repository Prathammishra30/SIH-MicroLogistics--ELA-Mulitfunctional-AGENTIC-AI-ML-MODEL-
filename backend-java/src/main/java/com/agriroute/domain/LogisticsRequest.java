package com.agriroute.domain;

import java.time.LocalDateTime;

public class LogisticsRequest {
    private String id;
    private String farmerId;
    private String productId;
    private String transporterId;
    private String productName;
    private double quantity;
    private String pickupLocation;
    private String destination;
    private double estimatedEarnings;
    private String status;
    private String eta;
    private LocalDateTime createdAt;

    public LogisticsRequest() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
    }

    public LogisticsRequest(String id, String farmerId, String productId, String productName, double quantity, String pickupLocation, String destination, double estimatedEarnings) {
        this.id = id;
        this.farmerId = farmerId;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.pickupLocation = pickupLocation;
        this.destination = destination;
        this.estimatedEarnings = estimatedEarnings;
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFarmerId() { return farmerId; }
    public void setFarmerId(String farmerId) { this.farmerId = farmerId; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getTransporterId() { return transporterId; }
    public void setTransporterId(String transporterId) { this.transporterId = transporterId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = quantity; }

    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public double getEstimatedEarnings() { return estimatedEarnings; }
    public void setEstimatedEarnings(double estimatedEarnings) { this.estimatedEarnings = estimatedEarnings; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getEta() { return eta; }
    public void setEta(String eta) { this.eta = eta; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
