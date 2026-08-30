package com.agriroute.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "market_opportunities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketOpportunity {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "demand_item", nullable = false, length = 255)
    private String demandItem;

    @Column(name = "buyer", length = 255)
    private String buyer;

    @Column(name = "price", length = 100)
    private String price;

    @Column(name = "quantity_required", length = 100)
    private String quantityRequired;

    @Column(name = "distance", length = 100)
    private String distance;

    @Column(name = "logistics_available")
    private Boolean logisticsAvailable = true;

    @Column(name = "match_score")
    private Integer matchScore = 90;

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