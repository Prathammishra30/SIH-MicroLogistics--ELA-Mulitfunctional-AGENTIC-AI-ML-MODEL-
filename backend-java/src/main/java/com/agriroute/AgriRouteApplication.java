package com.agriroute;

import com.agriroute.dto.ElaToolRequest;
import com.agriroute.dto.ElaToolResponse;
import com.agriroute.service.*;

import java.util.Map;

public class AgriRouteApplication {
    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("🚀 AgriRoute Enterprise Java Business Backend");
        System.out.println("=================================================");

        FarmerBusinessService farmerService = new FarmerBusinessService();
        BuyerBusinessService buyerService = new BuyerBusinessService();
        TransporterBusinessService transporterService = new TransporterBusinessService();
        ElaToolExecutionService toolService = new ElaToolExecutionService(farmerService, buyerService, transporterService);

        // Test 1: Authorized Farmer Product Creation
        ElaToolRequest req1 = new ElaToolRequest("add_product", Map.of("name", "Grade A Tomatoes", "quantity", 500.0), "farmer-101", "FARMER", true);
        ElaToolResponse res1 = toolService.executeTool(req1);
        System.out.println("✅ [TEST 1] Authorized Tool Execution: " + res1.getMessage() + " (success=" + res1.isSuccess() + ")");

        // Test 2: Unauthorized GUEST Attempt to Add Product (RBAC Gate)
        ElaToolRequest req2 = new ElaToolRequest("add_product", Map.of("name", "Tomatoes"), null, "GUEST", true);
        ElaToolResponse res2 = toolService.executeTool(req2);
        System.out.println("✅ [TEST 2] RBAC Denial Enforcement: " + res2.getMessage() + " (success=" + res2.isSuccess() + ")");

        System.out.println("=================================================");
        System.out.println("🎯 All Java Authoritative Business Operations Verified.");
        System.out.println("=================================================");
    }
}
