package com.agriroute.service;

import com.agriroute.domain.Product;
import com.agriroute.domain.LogisticsRequest;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class FarmerBusinessService {
    private final Map<String, Product> productDb = new ConcurrentHashMap<>();
    private final Map<String, LogisticsRequest> logisticsDb = new ConcurrentHashMap<>();

    public FarmerBusinessService() {
        // Seed default farmer products
        Product p1 = new Product("prod-1", "farmer-101", "Tomatoes", "Vegetables", 500.0, "A");
        Product p2 = new Product("prod-2", "farmer-101", "Onions", "Vegetables", 2000.0, "A");
        productDb.put(p1.getId(), p1);
        productDb.put(p2.getId(), p2);
    }

    public Product addProduct(String farmerId, String name, String category, double quantity, String grade) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Product quantity must be positive");
        }
        String id = "prod-" + UUID.randomUUID().toString().substring(0, 8);
        Product p = new Product(id, farmerId, name, category, quantity, grade);
        productDb.put(id, p);
        return p;
    }

    public List<Product> getFarmerProducts(String farmerId) {
        List<Product> list = new ArrayList<>();
        for (Product p : productDb.values()) {
            if (p.getFarmerId() != null && (farmerId == null || p.getFarmerId().equals(farmerId))) {
                list.add(p);
            }
        }
        return list;
    }

    public LogisticsRequest requestLogistics(String farmerId, String productId, String productName, double quantity, String pickup, String dest, double estEarnings) {
        String id = "req-" + UUID.randomUUID().toString().substring(0, 8);
        LogisticsRequest req = new LogisticsRequest(id, farmerId, productId, productName, quantity, pickup, dest, estEarnings);
        logisticsDb.put(id, req);
        return req;
    }

    public List<LogisticsRequest> getFarmerDeliveries(String farmerId) {
        List<LogisticsRequest> list = new ArrayList<>();
        for (LogisticsRequest req : logisticsDb.values()) {
            if (req.getFarmerId() != null && (farmerId == null || req.getFarmerId().equals(farmerId))) {
                list.add(req);
            }
        }
        return list;
    }
}
