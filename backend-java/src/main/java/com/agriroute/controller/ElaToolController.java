package com.agriroute.controller;

import com.agriroute.dto.ElaToolRequest;
import com.agriroute.dto.ElaToolResponse;
import com.agriroute.service.FarmerBusinessService;
import com.agriroute.service.BuyerBusinessService;
import com.agriroute.service.TransporterBusinessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/internal/ela")
public class ElaToolController {

    private static final Logger log = LoggerFactory.getLogger(ElaToolController.class);

    private final FarmerBusinessService farmerService;
    private final BuyerBusinessService buyerService;
    private final TransporterBusinessService transporterService;

    @Value("${app.internal-api-key}")
    private String internalApiKey;

    public ElaToolController(FarmerBusinessService farmerService,
                             BuyerBusinessService buyerService,
                             TransporterBusinessService transporterService) {
        this.farmerService = farmerService;
        this.buyerService = buyerService;
        this.transporterService = transporterService;
    }

    @PostMapping("/tool")
    public ResponseEntity<ElaToolResponse> executeTool(
            @RequestHeader(value = "X-Internal-API-Key", required = false) String apiKey,
            @Valid @RequestBody ElaToolRequest request,
            HttpServletRequest httpRequest) {

        String requestId = httpRequest.getHeader("X-Request-ID");
        if (requestId == null) {
            requestId = java.util.UUID.randomUUID().toString();
        }

        log.info("Internal tool execution: tool={}, userId={}, role={}, requestId={}",
                request.getToolName(), request.getUserId(), request.getRole(), requestId);

        // Verify internal API key
        if (!internalApiKey.equals(apiKey)) {
            log.warn("Invalid internal API key for requestId={}", requestId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ElaToolResponse.fail(request.getToolName(), "Invalid internal API key"));
        }

        try {
            String tool = request.getToolName();
            String roleStr = request.getRole() != null ? request.getRole().toUpperCase() : "GUEST";
            Map<String, Object> params = request.getParams() != null ? request.getParams() : Map.of();

            // Check if confirmed for consequential operations
            boolean confirmed = Boolean.TRUE.equals(request.getConfirmed());

            // Route to appropriate service
            return switch (tool) {
                case "create_product" -> handleCreateProduct(request.getUserId(), params, confirmed);
                case "create_logistics_request" -> handleCreateLogisticsRequest(request.getUserId(), params, confirmed);
                case "get_farmer_products" -> handleGetFarmerProducts(request.getUserId());
                case "get_farmer_deliveries" -> handleGetFarmerDeliveries(request.getUserId());
                case "create_procurement" -> handleCreateProcurement(request.getUserId(), params, confirmed);
                case "get_buyer_orders" -> handleGetBuyerOrders(request.getUserId());
                case "create_vehicle" -> handleCreateVehicle(request.getUserId(), params, confirmed);
                case "get_vehicles" -> handleGetVehicles(request.getUserId());
                case "get_available_trips" -> handleGetAvailableTrips();
                case "get_market_demand" -> handleGetMarketDemand(params);
                default -> ResponseEntity.badRequest()
                        .body(ElaToolResponse.fail(tool, "Unrecognized tool: " + tool));
            };
        } catch (Exception e) {
            log.error("Tool execution failed for tool={}, requestId={}", request.getToolName(), requestId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ElaToolResponse.fail(request.getToolName(), "Internal server error: " + e.getMessage()));
        }
    }

    private ResponseEntity<ElaToolResponse> handleCreateProduct(String userId, Map<String, Object> params, boolean confirmed) {
        if (!confirmed) {
            return ResponseEntity.ok(ElaToolResponse.fail("create_product", "Confirmation required"));
        }
        String name = (String) params.getOrDefault("name", "Tomatoes");
        String category = (String) params.getOrDefault("category", "Vegetables");
        String quantity = (String) params.getOrDefault("quantity", "500 kg");
        String grade = (String) params.getOrDefault("grade", "A");
        try {
            var product = farmerService.addProduct(userId, name, category, quantity, grade);
            return ResponseEntity.ok(ElaToolResponse.ok("create_product", "Product added successfully", product));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ElaToolResponse.fail("create_product", e.getMessage()));
        }
    }

    private ResponseEntity<ElaToolResponse> handleCreateLogisticsRequest(String userId, Map<String, Object> params, boolean confirmed) {
        if (!confirmed) {
            return ResponseEntity.ok(ElaToolResponse.fail("create_logistics_request", "Confirmation required"));
        }
        String productName = (String) params.getOrDefault("productName", "Tomatoes");
        String quantity = (String) params.getOrDefault("quantity", "500 kg");
        String pickupLocation = (String) params.getOrDefault("pickupLocation", "Farm Gate");
        String destination = (String) params.getOrDefault("destination", "Pune APMC Mandi");
        String estimatedEarnings = (String) params.getOrDefault("estimatedFreight", params.getOrDefault("estimatedEarnings", "₹2,500"));
        try {
            var request = farmerService.requestLogistics(userId, null, productName, quantity, pickupLocation, destination, estimatedEarnings);
            return ResponseEntity.ok(ElaToolResponse.ok("create_logistics_request", "Logistics request created successfully", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ElaToolResponse.fail("create_logistics_request", e.getMessage()));
        }
    }

    private ResponseEntity<ElaToolResponse> handleGetFarmerProducts(String userId) {
        try {
            var products = farmerService.getFarmerProducts(userId);
            return ResponseEntity.ok(ElaToolResponse.ok("get_farmer_products", "Products retrieved", products));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ElaToolResponse.fail("get_farmer_products", e.getMessage()));
        }
    }

    private ResponseEntity<ElaToolResponse> handleGetFarmerDeliveries(String userId) {
        try {
            var deliveries = farmerService.getFarmerDeliveries(userId);
            return ResponseEntity.ok(ElaToolResponse.ok("get_farmer_deliveries", "Deliveries retrieved", deliveries));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ElaToolResponse.fail("get_farmer_deliveries", e.getMessage()));
        }
    }

    private ResponseEntity<ElaToolResponse> handleCreateProcurement(String userId, Map<String, Object> params, boolean confirmed) {
        if (!confirmed) {
            return ResponseEntity.ok(ElaToolResponse.fail("create_procurement", "Confirmation required"));
        }
        String cropName = (String) params.getOrDefault("cropName", "Tomatoes");
        String quantity = (String) params.getOrDefault("quantityRequired", params.getOrDefault("quantity", "500 kg"));
        String targetPrice = (String) params.getOrDefault("maxPricePerKg", params.getOrDefault("targetPrice", "₹40/kg"));
        String destination = (String) params.getOrDefault("deliveryLocation", params.getOrDefault("destination", "Pune APMC Mandi"));
        try {
            var procurement = buyerService.postProcurement(userId, cropName, quantity, targetPrice, destination);
            return ResponseEntity.ok(ElaToolResponse.ok("create_procurement", "Procurement order posted successfully", procurement));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ElaToolResponse.fail("create_procurement", e.getMessage()));
        }
    }

    private ResponseEntity<ElaToolResponse> handleGetBuyerOrders(String userId) {
        try {
            var orders = buyerService.getBuyerOrders(userId);
            return ResponseEntity.ok(ElaToolResponse.ok("get_buyer_orders", "Orders retrieved", orders));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ElaToolResponse.fail("get_buyer_orders", e.getMessage()));
        }
    }

    private ResponseEntity<ElaToolResponse> handleCreateVehicle(String userId, Map<String, Object> params, boolean confirmed) {
        if (!confirmed) {
            return ResponseEntity.ok(ElaToolResponse.fail("create_vehicle", "Confirmation required"));
        }
        String fullName = (String) params.getOrDefault("fullName", "Driver");
        String vehicleType = (String) params.getOrDefault("vehicleType", "Mini Truck (750 kg)");
        String vehicleRegNo = (String) params.getOrDefault("vehicleRegNo", "MH 12 AB 9876");
        String capacity = (String) params.getOrDefault("capacity", "750 kg");
        String operatingRegion = (String) params.getOrDefault("operatingRegion", "Pune Region");
        String phone = (String) params.getOrDefault("phone", "+91 9876543210");
        try {
            var vehicle = transporterService.registerVehicle(userId, fullName, vehicleType, vehicleRegNo, capacity, operatingRegion, phone);
            return ResponseEntity.ok(ElaToolResponse.ok("create_vehicle", "Vehicle registered successfully", vehicle));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ElaToolResponse.fail("create_vehicle", e.getMessage()));
        }
    }

    private ResponseEntity<ElaToolResponse> handleGetVehicles(String userId) {
        try {
            var vehicles = transporterService.getTransporterVehicles(userId);
            return ResponseEntity.ok(ElaToolResponse.ok("get_vehicles", "Vehicles retrieved", vehicles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ElaToolResponse.fail("get_vehicles", e.getMessage()));
        }
    }

    private ResponseEntity<ElaToolResponse> handleGetAvailableTrips() {
        try {
            var trips = transporterService.getAvailableTrips();
            return ResponseEntity.ok(ElaToolResponse.ok("get_available_trips", "Available trips retrieved", trips));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ElaToolResponse.fail("get_available_trips", e.getMessage()));
        }
    }

    private ResponseEntity<ElaToolResponse> handleGetMarketDemand(Map<String, Object> params) {
        // Market demand is global - no auth required
        return ResponseEntity.ok(ElaToolResponse.ok("get_market_demand", "Market demand retrieved", java.util.List.of()));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "agriroute-java-backend",
                "version", "1.0.0"
        ));
    }
}