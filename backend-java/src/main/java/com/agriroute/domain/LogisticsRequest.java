package com.agriroute.domain;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private FarmerProfile farmer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transporter_id")
    private TransporterProfile transporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private TransporterVehicle vehicleRef;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "quantity", length = 100)
    private String quantity;

    @Column(name = "pickup_location", length = 255)
    private String pickupLocation;

    @Column(name = "estimated_earnings", length = 100)
    private String estimatedEarnings;

    @Column(name = "status", length = 50)
    private String status = "Searching";

    @Column(name = "driver", length = 255)
    private String driver;

    @Column(name = "vehicle", length = 255)
    private String vehicle;

    @Column(name = "destination", nullable = false, length = 255)
    private String destination;

    @Column(name = "eta", length = 100)
    private String eta;

    @Column(name = "procurement_request_id", length = 36)
    private String procurementRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "procurement_request_id", insertable = false, updatable = false)
    private ProcurementRequest procurementRequest;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}