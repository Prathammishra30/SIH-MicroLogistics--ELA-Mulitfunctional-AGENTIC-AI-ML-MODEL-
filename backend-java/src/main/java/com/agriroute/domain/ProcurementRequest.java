package com.agriroute.domain;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private BuyerProfile buyer;

    @Column(name = "product", nullable = false, length = 255)
    private String product;

    @Column(name = "quantity", length = 100)
    private String quantity;

    @Column(name = "target_price", length = 100)
    private String targetPrice;

    @Column(name = "destination", length = 255)
    private String destination;

    @Column(name = "required_by", length = 50)
    private String requiredBy;

    @Column(name = "buyer_name", length = 255)
    private String buyerName;

    @Column(name = "farmer_name", length = 255)
    private String farmerName;

    @Column(name = "status", length = 50)
    private String status = "Open";

    @Column(name = "logistics_request_id", length = 36)
    private String logisticsRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logistics_request_id", insertable = false, updatable = false)
    private LogisticsRequest logisticsRequest;

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