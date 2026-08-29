package com.agriroute.service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class BuyerBusinessService {
    private final Map<String, Map<String, Object>> procurementDb = new ConcurrentHashMap<>();

    public Map<String, Object> postProcurement(String buyerId, String cropName, double quantityKg, double maxPricePerKg, String deliveryLocation) {
        String id = "proc-" + UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> proc = new HashMap<>();
        proc.put("id", id);
        proc.put("buyerId", buyerId);
        proc.put("cropName", cropName);
        proc.put("quantityKg", quantityKg);
        proc.put("maxPricePerKg", maxPricePerKg);
        proc.put("deliveryLocation", deliveryLocation);
        proc.put("status", "ACTIVE");
        proc.put("createdAt", java.time.LocalDateTime.now().toString());

        procurementDb.put(id, proc);
        return proc;
    }

    public List<Map<String, Object>> getBuyerOrders(String buyerId) {
        return new ArrayList<>(procurementDb.values());
    }
}
