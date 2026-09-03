package com.agriroute.service;

import com.agriroute.domain.BuyerProfile;
import com.agriroute.domain.ProcurementRequest;
import com.agriroute.repository.BuyerProfileRepository;
import com.agriroute.repository.ProcurementRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@SuppressWarnings("null")
public class BuyerBusinessService {
    private final BuyerProfileRepository buyerProfileRepository;
    private final ProcurementRequestRepository procurementRequestRepository;

    public BuyerBusinessService(BuyerProfileRepository buyerProfileRepository,
                                ProcurementRequestRepository procurementRequestRepository) {
        this.buyerProfileRepository = buyerProfileRepository;
        this.procurementRequestRepository = procurementRequestRepository;
    }

    public BuyerProfile getOrCreateBuyerProfile(String userId) {
        return buyerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    BuyerProfile profile = BuyerProfile.builder()
                            .id(UUID.randomUUID().toString())
                            .build();
                    return buyerProfileRepository.save(profile);
                });
    }

    public ProcurementRequest postProcurement(String userId, String cropName, String quantityRequired, 
                                              String targetPrice, String deliveryLocation) {
        BuyerProfile profile = buyerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buyer profile not found for user: " + userId));

        ProcurementRequest procurement = ProcurementRequest.builder()
                .id(UUID.randomUUID().toString())
                .buyer(profile)
                .product(cropName != null ? cropName : "Produce")
                .quantity(quantityRequired != null ? quantityRequired : "500 kg")
                .targetPrice(targetPrice != null ? targetPrice : "₹40/kg")
                .destination(deliveryLocation != null ? deliveryLocation : "Pune APMC Mandi")
                .requiredBy(java.time.LocalDate.now().plusDays(7).toString())
                .buyerName(profile.getContactPerson() != null ? profile.getContactPerson() : profile.getBusinessName())
                .status("Open")
                .build();

        return procurementRequestRepository.save(procurement);
    }

    public List<ProcurementRequest> getBuyerOrders(String userId) {
        BuyerProfile profile = buyerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Buyer profile not found for user: " + userId));
        return procurementRequestRepository.findByBuyerIdOrderByCreatedAtDesc(profile.getId());
    }
}