package com.agriroute.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transporter_vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransporterVehicle {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"transporterId\"", nullable = false)
    private TransporterProfile transporter;

    @Column(name = "type", nullable = false, length = 255)
    private String type;

    @Column(name = "registration", unique = true, nullable = false, length = 50)
    private String registration;

    @Column(name = "capacity", nullable = false, length = 50)
    private String capacity;

    @Column(name = "\"capacityKg\"", nullable = false)
    private Integer capacityKg = 0;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "Available";

    @Column(name = "utilization", nullable = false)
    private Integer utilization = 0;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "vehicleRef")
    private java.util.List<LogisticsRequest> logisticsRequests = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}
