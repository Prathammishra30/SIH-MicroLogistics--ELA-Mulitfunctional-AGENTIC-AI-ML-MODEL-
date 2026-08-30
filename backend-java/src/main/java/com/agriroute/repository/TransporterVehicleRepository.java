package com.agriroute.repository;

import com.agriroute.domain.TransporterVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransporterVehicleRepository extends JpaRepository<TransporterVehicle, String> {
    List<TransporterVehicle> findByTransporterId(String transporterId);
}