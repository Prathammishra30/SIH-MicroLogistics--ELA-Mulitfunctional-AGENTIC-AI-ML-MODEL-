package com.agriroute.repository;

import com.agriroute.domain.LogisticsRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface LogisticsRequestRepository extends JpaRepository<LogisticsRequest, String> {
    List<LogisticsRequest> findByFarmerIdOrderByCreatedAtDesc(String farmerId);
    List<LogisticsRequest> findByStatusIn(java.util.List<String> statuses);
}