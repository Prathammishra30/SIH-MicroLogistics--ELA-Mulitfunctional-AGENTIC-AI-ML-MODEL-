package com.agriroute.service;

import com.agriroute.domain.LogisticsRequest;
import com.agriroute.domain.TransporterProfile;
import com.agriroute.domain.TransporterVehicle;
import com.agriroute.repository.LogisticsRequestRepository;
import com.agriroute.repository.TransporterProfileRepository;
import com.agriroute.repository.TransporterVehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TransporterBusinessService {
    private final TransporterProfileRepository transporterProfileRepository;
    private final TransporterVehicleRepository transporterVehicleRepository;
    private final LogisticsRequestRepository logisticsRequestRepository;

    public TransporterBusinessService(TransporterProfileRepository transporterProfileRepository,
                                      TransporterVehicleRepository transporterVehicleRepository,
                                      LogisticsRequestRepository logisticsRequestRepository) {
        this.transporterProfileRepository = transporterProfileRepository;
        this.transporterVehicleRepository = transporterVehicleRepository;
        this.logisticsRequestRepository = logisticsRequestRepository;
    }

    public TransporterProfile getOrCreateTransporterProfile(String userId) {
        return transporterProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    TransporterProfile profile = TransporterProfile.builder()
                            .id(UUID.randomUUID().toString())
                            .build();
                    return transporterProfileRepository.save(profile);
                });
    }

    public TransporterVehicle registerVehicle(String userId, String fullName, String vehicleType, 
                                              String vehicleRegNo, String capacity, String operatingRegion, String phone) {
        TransporterProfile profile = transporterProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Transporter profile not found for user: " + userId));

        // Update profile's operating region if provided
        if (operatingRegion != null && !operatingRegion.isEmpty()) {
            profile.setOperatingRegion(operatingRegion);
            transporterProfileRepository.save(profile);
        }

        TransporterVehicle vehicle = TransporterVehicle.builder()
                .id(UUID.randomUUID().toString())
                .transporter(profile)
                .type(vehicleType != null ? vehicleType : "Mini Truck (750 kg)")
                .registration(vehicleRegNo != null ? vehicleRegNo : "MH 12 AB 9876")
                .capacity(capacity != null ? capacity : "750 kg")
                .capacityKg(parseCapacityKg(capacity))
                .status("Available")
                .build();

        return transporterVehicleRepository.save(vehicle);
    }

    private Integer parseCapacityKg(String capacity) {
        if (capacity == null) return 750;
        try {
            String numStr = capacity.replaceAll("[^0-9.]", "");
            double val = Double.parseDouble(numStr);
            if (capacity.toLowerCase().contains("ton") || capacity.toLowerCase().contains("mt")) {
                return (int) (val * 1000);
            }
            return (int) val;
        } catch (Exception e) {
            return 750;
        }
    }

    public List<TransporterVehicle> getTransporterVehicles(String userId) {
        TransporterProfile profile = transporterProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Transporter profile not found for user: " + userId));
        return transporterVehicleRepository.findByTransporterId(profile.getId());
    }

    public List<LogisticsRequest> getAvailableTrips() {
        return logisticsRequestRepository.findByStatusIn(java.util.List.of("Searching", "Available"));
    }
}