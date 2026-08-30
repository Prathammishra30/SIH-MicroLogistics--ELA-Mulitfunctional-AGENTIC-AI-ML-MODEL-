package com.agriroute.repository;

import com.agriroute.domain.TransporterProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TransporterProfileRepository extends JpaRepository<TransporterProfile, String> {
    Optional<TransporterProfile> findByUserId(String userId);
}