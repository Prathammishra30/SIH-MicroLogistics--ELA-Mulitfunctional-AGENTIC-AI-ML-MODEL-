package com.agriroute.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "procurement_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcurementRequest {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"buyerId\"", nullable = false)
    private BuyerProfile buyer;

    @Column(name = "product", nullable = false, length = 255)
    private String product;

    @Column(name = "quantity", nullable = false, length = 100)
    private String quantity;

    @Column(name = "\"targetPrice\"", nullable = false, length = 100)
    private String targetPrice;

    @Column(name = "destination", nullable = false, length = 255)
    private String destination;

    @Column(name = "\"requiredBy\"", nullable = false, length = 50)
    private String requiredBy;

    @Column(name = "\"buyerName\"", nullable = false, length = 255)
    private String buyerName;

    @Column(name = "\"farmerName\"", length = 255)
    private String farmerName;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "Open";

    @Column(name = "\"logisticsRequestId\"", length = 36)
    private String logisticsRequestId;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "procurementRequest")
    private java.util.List<LogisticsRequest> logisticsRequests = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}
