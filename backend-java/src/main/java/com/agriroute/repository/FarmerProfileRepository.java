package com.agriroute.repository;

import com.agriroute.domain.FarmerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FarmerProfileRepository extends JpaRepository<FarmerProfile, String> {
    Optional<FarmerProfile> findByUserId(String userId);
}