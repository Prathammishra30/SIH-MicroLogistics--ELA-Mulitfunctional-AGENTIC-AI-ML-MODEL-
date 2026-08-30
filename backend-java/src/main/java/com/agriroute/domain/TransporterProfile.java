package com.agriroute.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transporter_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransporterProfile {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "vehicle_type", length = 255)
    private String vehicleType = "Pickup (1.5 - 2.5 MT)";

    @Column(name = "vehicle_reg_no", length = 50)
    private String vehicleRegNo;

    @Column(name = "capacity", length = 50)
    private String capacity = "2.0 MT";

    @Column(name = "operating_region", length = 255)
    private String operatingRegion = "Western Maharashtra (Pune - Satara - Kolhapur)";

    @Column(name = "ownership", length = 255)
    private String ownership = "Driver & Owner";

    @Column(name = "phone", length = 20)
    private String phone;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "transporter", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<TransporterVehicle> vehicles = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "transporter", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<LogisticsRequest> assignedTrips = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}