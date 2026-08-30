package com.agriroute.repository;

import com.agriroute.domain.BuyerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BuyerProfileRepository extends JpaRepository<BuyerProfile, String> {
    Optional<BuyerProfile> findByUserId(String userId);
}