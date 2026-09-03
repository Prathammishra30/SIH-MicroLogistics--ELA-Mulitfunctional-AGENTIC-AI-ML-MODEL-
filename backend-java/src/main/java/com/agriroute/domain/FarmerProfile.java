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

    @JsonBackReference("user-farmer")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"", unique = true, nullable = false)
    private User user;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "village", length = 255)
    private String village;

    @Column(name = "district", length = 255)
    private String district;

    @Builder.Default
    @Column(name = "state", length = 255)
    private String state = "Maharashtra";

    @Builder.Default
    @Column(name = "\"producerType\"", length = 255)
    private String producerType = "Farmer";

    @Builder.Default
    @Column(name = "category", length = 255)
    private String category = "Fresh Vegetables & Fruits";

    @Column(name = "\"farmName\"", length = 255)
    private String farmName;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @Builder.Default
    @JsonIgnore
    @OneToMany(mappedBy = "farmer", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Product> products = new java.util.ArrayList<>();

    @Builder.Default
    @JsonIgnore
    @OneToMany(mappedBy = "farmer", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<LogisticsRequest> logisticsRequests = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}
