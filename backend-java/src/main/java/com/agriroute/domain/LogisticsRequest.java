package com.agriroute.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "logistics_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogisticsRequest {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"farmerId\"", nullable = false)
    private FarmerProfile farmer;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"productId\"")
    private Product product;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"transporterId\"")
    private TransporterProfile transporter;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"vehicleId\"")
    private TransporterVehicle vehicleRef;

    @Column(name = "\"productName\"", nullable = false, length = 255)
    private String productName;

    @Column(name = "quantity", length = 100)
    private String quantity;

    @Column(name = "\"pickupLocation\"", length = 255)
    private String pickupLocation;

    @Column(name = "\"estimatedEarnings\"", length = 100)
    private String estimatedEarnings;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "Searching";

    @Column(name = "driver", length = 255)
    private String driver;

    @Column(name = "vehicle", length = 255)
    private String vehicle;

    @Column(name = "destination", nullable = false, length = 255)
    private String destination;

    @Column(name = "eta", length = 100)
    private String eta;

    @Column(name = "\"procurementRequestId\"", length = 36)
    private String procurementRequestId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"procurementRequestId\"", insertable = false, updatable = false)
    private ProcurementRequest procurementRequest;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}
