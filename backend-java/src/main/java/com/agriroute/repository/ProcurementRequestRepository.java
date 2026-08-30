package com.agriroute.repository;

import com.agriroute.domain.ProcurementRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProcurementRequestRepository extends JpaRepository<ProcurementRequest, String> {
    List<ProcurementRequest> findByBuyerIdOrderByCreatedAtDesc(String buyerId);
}