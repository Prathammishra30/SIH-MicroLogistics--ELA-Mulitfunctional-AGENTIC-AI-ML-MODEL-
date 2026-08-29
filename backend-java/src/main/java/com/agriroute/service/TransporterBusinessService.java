package com.agriroute.service;

import com.agriroute.domain.TransporterProfile;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class TransporterBusinessService {
    private final Map<String, TransporterProfile> vehicleDb = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> tripDb = new ConcurrentHashMap<>();

    public TransporterBusinessService() {
        TransporterProfile v1 = new TransporterProfile("veh-1", "trans-101", "Sunil Deshmukh", "Mini Truck (750 kg)", "MH 12 AB 9876", 750.0, "Pune - Nashik", "+91 9876543210");
        vehicleDb.put(v1.getId(), v1);
    }

    public TransporterProfile registerVehicle(String userId, String fullName, String vehicleType, String vehicleRegNo, double capacity, String region, String phone) {
        String id = "veh-" + UUID.randomUUID().toString().substring(0, 8);
        TransporterProfile p = new TransporterProfile(id, userId, fullName, vehicleType, vehicleRegNo, capacity, region, phone);
        vehicleDb.put(id, p);
        return p;
    }

    public List<TransporterProfile> getTransporterVehicles(String userId) {
        List<TransporterProfile> list = new ArrayList<>();
        for (TransporterProfile v : vehicleDb.values()) {
            if (userId == null || v.getUserId().equals(userId)) {
                list.add(v);
            }
        }
        return list;
    }

    public List<Map<String, Object>> getAvailableTrips() {
        List<Map<String, Object>> trips = new ArrayList<>();
        Map<String, Object> t1 = new HashMap<>();
        t1.put("id", "trip-1");
        t1.put("origin", "Narayangaon Mandi");
        t1.put("destination", "Pune Vashi APMC");
        t1.put("cargo", "500 kg Tomatoes");
        t1.put("payout", 3200.0);
        t1.put("status", "AVAILABLE");
        trips.add(t1);
        return trips;
    }
}
