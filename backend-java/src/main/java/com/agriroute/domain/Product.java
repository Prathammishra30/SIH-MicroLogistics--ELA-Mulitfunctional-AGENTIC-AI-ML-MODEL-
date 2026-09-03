package com.agriroute.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"farmerId\"", nullable = false)
    private FarmerProfile farmer;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "category", nullable = false, length = 255)
    private String category;

    @Column(name = "quantity", nullable = false, length = 100)
    private String quantity;

    @Column(name = "grade", nullable = false, length = 50)
    private String grade;

    @Column(name = "\"harvestDate\"", nullable = false, length = 20)
    private String harvestDate;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 50)
    private String status = "Available";

    @CreationTimestamp
    @Column(name = "\"createdAt\"", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @Builder.Default
    @JsonIgnore
    @OneToMany(mappedBy = "product")
    private java.util.List<LogisticsRequest> logisticsRequests = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}
