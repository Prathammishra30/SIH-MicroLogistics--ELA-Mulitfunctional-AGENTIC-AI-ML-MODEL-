package com.agriroute.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "farmer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmerProfile {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "village", length = 255)
    private String village;

    @Column(name = "district", length = 255)
    private String district;

    @Column(name = "state", length = 255)
    private String state = "Maharashtra";

    @Column(name = "producer_type", length = 255)
    private String producerType = "Farmer";

    @Column(name = "category", length = 255)
    private String category = "Fresh Vegetables & Fruits";

    @Column(name = "farm_name", length = 255)
    private String farmName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "farmer", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Product> products = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "farmer", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<LogisticsRequest> logisticsRequests = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}