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

    @Column(name = "\"demandItem\"", nullable = false, length = 255)
    private String demandItem;

    @Column(name = "buyer", nullable = false, length = 255)
    private String buyer;

    @Column(name = "price", nullable = false, length = 100)
    private String price;

    @Column(name = "\"quantityRequired\"", nullable = false, length = 100)
    private String quantityRequired;

    @Column(name = "distance", nullable = false, length = 100)
    private String distance;

    @Column(name = "\"logisticsAvailable\"", nullable = false)
    private Boolean logisticsAvailable = true;

    @Column(name = "\"matchScore\"", nullable = false)
    private Integer matchScore = 90;

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
