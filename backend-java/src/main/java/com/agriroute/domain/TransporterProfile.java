package com.agriroute.domain;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @JsonBackReference("user-transporter")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"", unique = true, nullable = false)
    private User user;

    @Column(name = "\"fullName\"", length = 255)
    private String fullName;

    @Column(name = "\"vehicleType\"", length = 255)
    private String vehicleType = "Pickup (1.5 - 2.5 MT)";

    @Column(name = "\"vehicleRegNo\"", length = 50)
    private String vehicleRegNo;

    @Column(name = "capacity", length = 50)
    private String capacity = "2.0 MT";

    @Column(name = "\"operatingRegion\"", length = 255)
    private String operatingRegion = "Western Maharashtra (Pune - Satara - Kolhapur)";

    @Column(name = "ownership", length = 255)
    private String ownership = "Driver & Owner";

    @Column(name = "phone", length = 20)
    private String phone;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "transporter", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<TransporterVehicle> vehicles = new java.util.ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "transporter")
    private java.util.List<LogisticsRequest> assignedTrips = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}
