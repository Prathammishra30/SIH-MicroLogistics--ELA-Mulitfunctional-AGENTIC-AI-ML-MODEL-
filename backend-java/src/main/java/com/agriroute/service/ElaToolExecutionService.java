package com.agriroute.service;

import com.agriroute.domain.UserRole;
import com.agriroute.dto.ElaToolRequest;
import com.agriroute.dto.ElaToolResponse;

import java.util.Map;

public class ElaToolExecutionService {
    private final FarmerBusinessService farmerService;
    private final BuyerBusinessService buyerService;
    private final TransporterBusinessService transporterService;

    public ElaToolExecutionService(FarmerBusinessService farmerService, BuyerBusinessService buyerService, TransporterBusinessService transporterService) {
        this.farmerService = farmerService;
        this.buyerService = buyerService;
        this.transporterService = transporterService;
    }

    public ElaToolResponse executeTool(ElaToolRequest request) {
        String tool = request.getToolName();
        String roleStr = request.getRole() != null ? request.getRole().toUpperCase() : "GUEST";
        UserRole role = null;
        try {
            role = UserRole.valueOf(roleStr);
        } catch (Exception e) {
            // GUEST is an application context, not a persisted Prisma Role enum.
            // Keeping it null makes every mutation fail the role gate below.
        }

        Map<String, Object> p = request.getParams() != null ? request.getParams() : Map.of();

        // 1. RBAC & Mutation Authorization Gates
        switch (tool) {
            case "add_product":
            case "create_product":
                if (role != UserRole.FARMER && role != UserRole.ADMIN) {
                    return ElaToolResponse.fail(tool, "Access Denied: Only registered Farmers can add products.");
                }
                String name = (String) p.getOrDefault("name", "Tomatoes");
                String cat = (String) p.getOrDefault("category", "Vegetables");
                String qty = p.containsKey("quantity") ? p.get("quantity").toString() : "500 kg";
                String grade = (String) p.getOrDefault("grade", "A");
                String harvestDate = (String) p.getOrDefault("harvestDate", java.time.LocalDate.now().toString());
                Object savedProduct = farmerService.addProduct(request.getUserId(), name, cat, qty, grade, harvestDate);
                return ElaToolResponse.ok(tool, "Product added successfully to inventory.", savedProduct);

            case "get_farmer_products":
                return ElaToolResponse.ok(tool, "Farmer products retrieved.", farmerService.getFarmerProducts(request.getUserId()));

            case "request_transport":
            case "create_logistics_request":
                if (role != UserRole.FARMER && role != UserRole.ADMIN) {
                    return ElaToolResponse.fail(tool, "Access Denied: Only Farmers can request transport.");
                }
                String prodName = (String) p.getOrDefault("productName", "Tomatoes");
                String logQty = p.containsKey("quantity") ? p.get("quantity").toString() : "500 kg";
                String pickup = (String) p.getOrDefault("pickupLocation", "Farmer Farm");
                String dest = (String) p.getOrDefault("destination", "Pune APMC Mandi");
                String earnings = p.containsKey("estimatedEarnings") ? p.get("estimatedEarnings").toString() : "3500";
                Object logReq = farmerService.requestLogistics(request.getUserId(), "prod-1", prodName, logQty, pickup, dest, earnings);
                return ElaToolResponse.ok(tool, "Logistics request created successfully.", logReq);

            case "get_farmer_deliveries":
                return ElaToolResponse.ok(tool, "Farmer deliveries retrieved.", farmerService.getFarmerDeliveries(request.getUserId()));

            case "post_procurement":
            case "create_procurement":
                if (role != UserRole.BUYER && role != UserRole.ADMIN) {
                    return ElaToolResponse.fail(tool, "Access Denied: Only Buyers can post procurement demands.");
                }
                String crop = (String) p.getOrDefault("cropName", "Tomatoes");
                String bQty = p.containsKey("quantityKg") ? p.get("quantityKg").toString() : "500 kg";
                String maxPrice = p.containsKey("maxPricePerKg") ? p.get("maxPricePerKg").toString() : "45";
                String loc = (String) p.getOrDefault("deliveryLocation", "Pune APMC Mandi");
                Object proc = buyerService.postProcurement(request.getUserId(), crop, bQty, maxPrice, loc);
                return ElaToolResponse.ok(tool, "Procurement order posted successfully.", proc);

            case "get_buyer_orders":
                return ElaToolResponse.ok(tool, "Buyer orders retrieved.", buyerService.getBuyerOrders(request.getUserId()));

            case "add_vehicle":
            case "create_vehicle":
                if (role != UserRole.TRANSPORTER && role != UserRole.ADMIN) {
                    return ElaToolResponse.fail(tool, "Access Denied: Only Transporters can register vehicles.");
                }
                String fullName = (String) p.getOrDefault("fullName", "Sunil Deshmukh");
                String vType = (String) p.getOrDefault("vehicleType", "Mini Truck (750 kg)");
                String regNo = (String) p.getOrDefault("vehicleRegNo", "MH 12 AB 9876");
                String cap = p.containsKey("capacity") ? p.get("capacity").toString() : "750 kg";
                String reg = (String) p.getOrDefault("operatingRegion", "Pune Region");
                String phone = (String) p.getOrDefault("phone", "+91 9876543210");
                Object veh = transporterService.registerVehicle(request.getUserId(), fullName, vType, regNo, cap, reg, phone);
                return ElaToolResponse.ok(tool, "Vehicle registered successfully.", veh);

            case "get_vehicles":
                return ElaToolResponse.ok(tool, "Transporter vehicles retrieved.", transporterService.getTransporterVehicles(request.getUserId()));

            case "get_available_trips":
                return ElaToolResponse.ok(tool, "Available trips retrieved.", transporterService.getAvailableTrips());

            default:
                return ElaToolResponse.fail(tool, "Unrecognized application tool: " + tool);
        }
    }
}
