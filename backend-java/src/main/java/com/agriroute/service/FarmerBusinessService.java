package com.agriroute.service;

import com.agriroute.domain.FarmerProfile;
import com.agriroute.domain.LogisticsRequest;
import com.agriroute.domain.Product;
import com.agriroute.repository.FarmerProfileRepository;
import com.agriroute.repository.LogisticsRequestRepository;
import com.agriroute.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class FarmerBusinessService {
    private final FarmerProfileRepository farmerProfileRepository;
    private final LogisticsRequestRepository logisticsRequestRepository;
    private final ProductRepository productRepository;

    public FarmerBusinessService(FarmerProfileRepository farmerProfileRepository,
                                 LogisticsRequestRepository logisticsRequestRepository,
                                 ProductRepository productRepository) {
        this.farmerProfileRepository = farmerProfileRepository;
        this.logisticsRequestRepository = logisticsRequestRepository;
        this.productRepository = productRepository;
    }

    public FarmerProfile getOrCreateFarmerProfile(String userId) {
        return farmerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    FarmerProfile profile = FarmerProfile.builder()
                            .id(UUID.randomUUID().toString())
                            .build();
                    return farmerProfileRepository.save(profile);
                });
    }

    public List<Product> getFarmerProducts(String userId) {
        FarmerProfile profile = farmerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Farmer profile not found for user: " + userId));
        return productRepository.findByFarmerIdOrderByCreatedAtDesc(profile.getId());
    }

    public Product addProduct(String userId, String name, String category, String quantity, String grade, String harvestDate) {
        FarmerProfile profile = farmerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Farmer profile not found for user: " + userId));

        Product product = Product.builder()
                .id(UUID.randomUUID().toString())
                .farmer(profile)
                .name(name)
                .category(category != null ? category : "Vegetables")
                .quantity(quantity != null ? quantity : "500 kg")
                .grade(grade != null ? grade : "A")
                .harvestDate(harvestDate != null ? harvestDate : java.time.LocalDate.now().toString())
                .status("Available")
                .build();

        return productRepository.save(product);
    }

    public LogisticsRequest requestLogistics(String userId, String productId, String productName, 
                                             String quantity, String pickupLocation, String destination, 
                                             String estimatedEarnings) {
        FarmerProfile profile = farmerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Farmer profile not found for user: " + userId));

        Product product = null;
        if (productId != null && !productId.isEmpty()) {
            product = productRepository.findById(productId).orElse(null);
        }

        LogisticsRequest request = LogisticsRequest.builder()
                .id(UUID.randomUUID().toString())
                .farmer(profile)
                .product(product)
                .productName(productName != null ? productName : "Produce")
                .quantity(quantity != null ? quantity : "500 kg")
                .pickupLocation(pickupLocation != null ? pickupLocation : "Farm Gate")
                .destination(destination != null ? destination : "Pune APMC Mandi")
                .estimatedEarnings(estimatedEarnings != null ? estimatedEarnings : "₹2,500")
                .status("Searching")
                .build();

        return logisticsRequestRepository.save(request);
    }

    public List<LogisticsRequest> getFarmerDeliveries(String userId) {
        FarmerProfile profile = farmerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Farmer profile not found for user: " + userId));
        return logisticsRequestRepository.findByFarmerIdOrderByCreatedAtDesc(profile.getId());
    }
}