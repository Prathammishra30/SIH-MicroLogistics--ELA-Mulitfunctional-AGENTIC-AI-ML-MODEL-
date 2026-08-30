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
@Table(name = "buyer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuyerProfile {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @JsonBackReference("user-buyer")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"", unique = true, nullable = false)
    private User user;

    @Column(name = "\"businessName\"", length = 255)
    private String businessName;

    @Column(name = "\"contactPerson\"", length = 255)
    private String contactPerson;

    @Column(name = "\"businessType\"", length = 255)
    private String businessType = "APMC Licensed Commission Agent & Trader";

    @Column(name = "location", length = 255)
    private String location = "Navi Mumbai APMC Mandi";

    @Column(name = "gstin", length = 50)
    private String gstin;

    @Column(name = "phone", length = 20)
    private String phone;

    @CreationTimestamp
    @Column(name = "\"createdAt\"", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "buyer", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ProcurementRequest> procurements = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}
