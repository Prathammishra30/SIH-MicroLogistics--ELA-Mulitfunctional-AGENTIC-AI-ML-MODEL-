# ELA Cross-Role Match Scoring Engine
# Ported and integrated from RuralFlow Cross-Role Match Scoring Prototype
# Evaluates Farmer + Buyer + Transporter triples using Hard Gates + Weighted Sub-Scores + ML Utility

import math
import re
import uuid
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from datetime import date, timedelta
from pydantic import BaseModel, Field

from ai.ela.ml.models.matching import VehicleMatchingModel, VehicleMatchingFeatures


# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------

@dataclass
class FarmerListing:
    id: str = ""
    crop: str = "tomato"
    quantity_kg: float = 500.0
    quality_grade: Any = 1          # 1 (best) - 3 (lowest), or "A", "B", "C"
    harvest_date: Optional[date] = None
    asking_price_per_kg: float = 32.0
    lat: float = 19.9975
    lon: float = 73.7898
    needs_refrigeration: bool = False
    lng: Optional[float] = None
    farmer_id: Optional[str] = None
    product_id: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lon: Optional[float] = None

    def __post_init__(self):
        if not self.id:
            self.id = self.farmer_id or self.product_id or f"listing-{uuid.uuid4().hex[:6]}"
        if self.pickup_lat is not None:
            self.lat = self.pickup_lat
        if self.pickup_lon is not None:
            self.lon = self.pickup_lon
        elif self.lng is not None and self.lon == 73.7898:
            self.lon = self.lng
        if self.harvest_date is None:
            self.harvest_date = date.today()
        if isinstance(self.quality_grade, str):
            g_map = {"A": 1, "B": 2, "C": 3, "GRADE_A": 1, "GRADE_B": 2, "GRADE_C": 3}
            self.quality_grade = g_map.get(self.quality_grade.upper(), 1)


@dataclass
class BuyerProcurement:
    id: str = ""
    crop_needed: str = "tomato"
    budget_per_kg: float = 40.0
    lat: float = 18.5204
    lon: float = 73.8567
    quantity_needed_kg: float = 500.0
    min_quality_grade: Any = 1      # accepts this grade or better (lower = better) or "A", "B", "C"
    need_by_date: Optional[date] = None
    needed_by: Optional[date] = None
    max_radius_km: float = 150.0
    lng: Optional[float] = None
    buyer_id: Optional[str] = None
    procurement_id: Optional[str] = None
    destination: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_lon: Optional[float] = None

    def __post_init__(self):
        if not self.id:
            self.id = self.buyer_id or self.procurement_id or f"proc-{uuid.uuid4().hex[:6]}"
        if self.delivery_lat is not None:
            self.lat = self.delivery_lat
        if self.delivery_lon is not None:
            self.lon = self.delivery_lon
        elif self.lng is not None and self.lon == 73.8567:
            self.lon = self.lng
        if self.needed_by is not None and self.need_by_date is None:
            self.need_by_date = self.needed_by
        elif self.need_by_date is None:
            self.need_by_date = date.today() + timedelta(days=5)
        if isinstance(self.min_quality_grade, str):
            g_map = {"A": 1, "B": 2, "C": 3, "GRADE_A": 1, "GRADE_B": 2, "GRADE_C": 3}
            self.min_quality_grade = g_map.get(self.min_quality_grade.upper(), 1)


@dataclass
class TransporterCapacity:
    id: str = ""
    capacity_kg: float = 1000.0
    home_lat: float = 18.5204
    home_lon: float = 73.8567
    base_lat: Optional[float] = None
    base_lon: Optional[float] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    has_refrigeration: bool = False
    service_radius_km: float = 150.0
    max_radius_km: Optional[float] = None
    cost_per_km: float = 12.0
    available_from: Optional[date] = None
    available_to: Optional[date] = None
    transporter_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_type: Optional[str] = None
    registration: Optional[str] = None

    def __post_init__(self):
        if not self.id:
            self.id = self.transporter_id or self.vehicle_id or f"trans-{uuid.uuid4().hex[:6]}"
        if self.base_lat is not None:
            self.home_lat = self.base_lat
        elif self.current_lat is not None and self.home_lat == 18.5204:
            self.home_lat = self.current_lat
        if self.base_lon is not None:
            self.home_lon = self.base_lon
        elif self.current_lng is not None and self.home_lon == 73.8567:
            self.home_lon = self.current_lng
        if self.max_radius_km is not None:
            self.service_radius_km = self.max_radius_km
        if self.available_from is None:
            self.available_from = date.today()
        if self.available_to is None:
            self.available_to = date.today() + timedelta(days=7)


# ---------------------------------------------------------------------------
# Geography helper
# ---------------------------------------------------------------------------

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(max(0.0, min(1.0, a))))


# ---------------------------------------------------------------------------
# Hard gates — disqualify physically/logically impossible combinations
# before any scoring happens
# ---------------------------------------------------------------------------

def crops_match(c1: str, c2: str) -> bool:
    norm1 = c1.strip().lower()
    norm2 = c2.strip().lower()
    if norm1 == norm2:
        return True
    clean1 = re.sub(r'\b(organic|fresh|hybrid|desi|premium|grade\s+[a-c])\b', '', norm1).strip()
    clean2 = re.sub(r'\b(organic|fresh|hybrid|desi|premium|grade\s+[a-c])\b', '', norm2).strip()
    if clean1 == clean2:
        return True
    def stem(s: str) -> str:
        s = s.rstrip('s')
        if s.endswith('toe'):
            s = s[:-1]
        return s
    s1, s2 = stem(clean1), stem(clean2)
    if s1 and s2 and (s1 == s2 or s1 in s2 or s2 in s1):
        return True
    return False


def passes_gates(f: FarmerListing, b: BuyerProcurement, t: TransporterCapacity) -> Tuple[bool, str]:
    if not crops_match(f.crop, b.crop_needed):
        return False, "crop mismatch"
    if f.quality_grade > b.min_quality_grade:
        return False, "quality below buyer's minimum"
    if t.capacity_kg < f.quantity_kg:
        return False, "transporter capacity too small"
    if f.needs_refrigeration and not t.has_refrigeration:
        return False, "produce needs refrigeration, vehicle doesn't have it"
    span = haversine_km(f.lat, f.lon, b.lat, b.lon)
    if span > t.service_radius_km * 1.5:
        return False, "outside transporter's practical service range"
    return True, ""


# ---------------------------------------------------------------------------
# Sub-scores — each returns 0.0-1.0
# ---------------------------------------------------------------------------

def transport_cost_per_kg(f: FarmerListing, b: BuyerProcurement, t: TransporterCapacity) -> float:
    distance = haversine_km(f.lat, f.lon, b.lat, b.lon)
    return (distance * t.cost_per_km) / max(f.quantity_kg, 1.0)


def score_price_fit(f: FarmerListing, b: BuyerProcurement, cost_per_kg: float) -> float:
    effective_ask = f.asking_price_per_kg + cost_per_kg
    if effective_ask > b.budget_per_kg:
        overage = (effective_ask - b.budget_per_kg) / max(b.budget_per_kg, 1e-6)
        return max(0.0, 1.0 - overage * 2.0)
    margin = (b.budget_per_kg - effective_ask) / max(b.budget_per_kg, 1e-6)
    return min(1.0, 0.6 + margin)


def score_timing_fit(f: FarmerListing, b: BuyerProcurement, t: TransporterCapacity) -> float:
    if f.harvest_date > b.need_by_date:
        return 0.0
    if t.available_from > b.need_by_date or t.available_to < f.harvest_date:
        return 0.1
    slack_days = (b.need_by_date - f.harvest_date).days
    if slack_days <= 5:
        return max(0.6, 1.0 - (slack_days * 0.03))
    return max(0.2, 1.0 - (slack_days - 5) * 0.1)


def score_route_fit(f: FarmerListing, b: BuyerProcurement, t: TransporterCapacity) -> float:
    direct = haversine_km(f.lat, f.lon, b.lat, b.lon)
    if direct == 0.0:
        return 1.0
    via_transporter = (
        haversine_km(t.home_lat, t.home_lon, f.lat, f.lon) +
        haversine_km(f.lat, f.lon, b.lat, b.lon)
    )
    detour_ratio = via_transporter / direct
    return max(0.0, min(1.0, 2.0 - detour_ratio))


def score_capacity_fit(
    f: FarmerListing,
    t: TransporterCapacity,
    matching_model: Optional[VehicleMatchingModel] = None,
) -> Tuple[float, float]:
    """
    Computes capacity fitness by fusing analytical load utilization with
    the existing trained VehicleMatchingModel multi-objective utility score.
    Returns: (fused_score, ml_utility_score)
    """
    utilization = f.quantity_kg / max(t.capacity_kg, 1.0)
    base_fit = max(0.3, 1.0 - abs(utilization - 0.75))

    ml_score = base_fit
    if matching_model is not None:
        try:
            # Synchronously evaluate utility from trained weights
            w_util, w_rating, w_urg = matching_model._criteria_weights
            util_score = 1.0 - abs(0.75 - utilization) * 0.5 if t.capacity_kg >= f.quantity_kg else 0.20
            # Assume calibrated baseline rating of 4.6/5.0 and normal urgency
            rating = 4.6 / 5.0
            urg_score = 0.75
            ml_composite = float((w_util * util_score) + (w_rating * rating) + (w_urg * urg_score))
            ml_score = max(0.1, min(1.0, ml_composite))
        except Exception:
            ml_score = base_fit

    # Weighted blend: 70% analytical utilization + 30% trained preference ranking
    fused = 0.70 * base_fit + 0.30 * ml_score
    return round(max(0.0, min(1.0, fused)), 4), round(ml_score, 4)


WEIGHTS = {"price": 0.30, "timing": 0.25, "route": 0.25, "capacity": 0.20}


def match_score(
    f: FarmerListing,
    b: BuyerProcurement,
    t: TransporterCapacity,
    matching_model: Optional[VehicleMatchingModel] = None,
) -> Tuple[Optional[float], Dict[str, Any]]:
    """
    Evaluates candidate triple (Farmer + Buyer + Transporter).
    Returns (match_score, sub_scores_dict) or (None, {"excluded": reason})
    """
    ok, reason = passes_gates(f, b, t)
    if not ok:
        return None, {"excluded": reason}

    cost_per_kg = transport_cost_per_kg(f, b, t)
    cap_score, ml_utility = score_capacity_fit(f, t, matching_model)

    price_val = round(score_price_fit(f, b, cost_per_kg), 4)
    timing_val = round(score_timing_fit(f, b, t), 4)
    route_val = round(score_route_fit(f, b, t), 4)
    capacity_val = round(cap_score, 4)

    subs = {
        "price": price_val,
        "timing": timing_val,
        "route": route_val,
        "capacity": capacity_val,
        "price_fit": price_val,
        "timing_fit": timing_val,
        "route_fit": route_val,
        "capacity_fit": capacity_val,
        "ml_utility": ml_utility,
        "transport_cost_per_kg": round(cost_per_kg, 2),
    }

    # Overall weighted sum over the 4 primary sub-scores
    overall = (
        WEIGHTS["price"] * subs["price"] +
        WEIGHTS["timing"] * subs["timing"] +
        WEIGHTS["route"] * subs["route"] +
        WEIGHTS["capacity"] * subs["capacity"]
    )
    return round(overall, 4), subs


def explain(overall: float, subs: Dict[str, Any]) -> str:
    """
    Produces deterministic, faithful explanation of the match score
    identifying the strongest factor and the weakest factor.
    """
    normalized = dict(subs)
    for alias, target in [("price_fit", "price"), ("timing_fit", "timing"), ("route_fit", "route"), ("capacity_fit", "capacity")]:
        if alias in normalized and target not in normalized:
            normalized[target] = normalized[alias]

    core_subs = {k: normalized[k] for k in ["price", "timing", "route", "capacity"] if k in normalized}
    if not core_subs:
        return f"score {overall:.2f}"

    best = max(core_subs, key=core_subs.get)
    worst = min(core_subs, key=core_subs.get)

    good = {
        "price": "price fits comfortably within budget",
        "timing": "delivery window comfortably met",
        "route": "efficient route with little detour",
        "capacity": "good use of vehicle capacity",
    }
    weak = {
        "price": "price is tight against budget",
        "timing": "delivery timing is tight",
        "route": "route adds a meaningful detour",
        "capacity": "vehicle capacity is a mismatch",
    }
    pct = int(round(overall * 100))
    return f"score {overall:.2f} ({pct}%) — strongest on {good[best]}; watch: {weak[worst]}"


def explain_localized(overall: float, subs: Dict[str, Any], lang: str = "en") -> str:
    """
    Multilingual explainability for Hindi and Marathi dashboards and Voice Orb.
    """
    normalized = dict(subs)
    for alias, target in [("price_fit", "price"), ("timing_fit", "timing"), ("route_fit", "route"), ("capacity_fit", "capacity")]:
        if alias in normalized and target not in normalized:
            normalized[target] = normalized[alias]

    core_subs = {k: normalized[k] for k in ["price", "timing", "route", "capacity"] if k in normalized}
    pct = int(round(overall * 100))
    if not core_subs:
        return f"Score {overall:.2f} ({pct}%)"

    best = max(core_subs, key=core_subs.get)
    worst = min(core_subs, key=core_subs.get)

    if lang == "hi":
        good_hi = {
            "price": "कीमत बजट के पूरी तरह अनुकूल है",
            "timing": "डिलीवरी का समय बहुत उपयुक्त है",
            "route": "मार्ग सीधा है और चक्कर बहुत कम है",
            "capacity": "वाहन की क्षमता का बेहतरीन उपयोग है",
        }
        weak_hi = {
            "price": "कीमत बजट के बिल्कुल करीब है",
            "timing": "डिलीवरी की समय-सीमा बहुत कम है",
            "route": "मार्ग में थोड़ा अतिरिक्त चक्कर शामिल है",
            "capacity": "वाहन की क्षमता का थोड़ा बेमेल है",
        }
        return f"मैच स्कोर {overall:.2f} ({pct}%) — सबसे मजबूत पहलू: {good_hi[best]}; ध्यान दें: {weak_hi[worst]}"

    elif lang == "mr":
        good_mr = {
            "price": "किंमत बजेटमध्ये अगदी योग्य बसते",
            "timing": "डिलिव्हरीची वेळ उत्तम प्रकारे जुळते",
            "route": "मार्ग सोयीस्कर आहे आणि फेरा कमी आहे",
            "capacity": "वाहनाच्या क्षमतेचा योग्य वापर होतो",
        }
        weak_mr = {
            "price": "किंमत बजेटच्या अगदी जवळ आहे",
            "timing": "डिलिव्हरीची मुदत घट्ट आहे",
            "route": "मार्गात थोडा जास्तीचा फेरा आहे",
            "capacity": "वाहनाची क्षमता थोडी कमी-अधिक आहे",
        }
        return f"साम्य गुण {overall:.2f} ({pct}%) — सर्वात चांगला घटक: {good_mr[best]}; लक्ष ठेवा: {weak_mr[worst]}"

    return explain(overall, subs)


# ---------------------------------------------------------------------------
# CrossRoleMatchEngine
# ---------------------------------------------------------------------------

class CrossRoleMatchEngine:
    """
    Production Cross-Role Match Scoring Engine for ELA Orchestration.
    Finds and ranks candidate triples among Farmers, Buyers, and Transporters.
    """

    def __init__(self, matching_model: Optional[VehicleMatchingModel] = None):
        self.matching_model = matching_model or VehicleMatchingModel()

    def score_triple(
        self,
        farmer: FarmerListing,
        buyer: BuyerProcurement,
        transporter: TransporterCapacity,
    ) -> Tuple[Optional[float], Dict[str, Any]]:
        return match_score(farmer, buyer, transporter, self.matching_model)

    def find_best_matches_for_farmer(
        self,
        farmer: FarmerListing,
        buyers: List[BuyerProcurement],
        transporters: List[TransporterCapacity],
        top_n: int = 5,
    ) -> List[Tuple[float, BuyerProcurement, TransporterCapacity, Dict[str, Any]]]:
        results = []
        for b in buyers:
            for t in transporters:
                score, subs = self.score_triple(farmer, b, t)
                if score is not None:
                    results.append((score, b, t, subs))
        results.sort(key=lambda r: -r[0])
        return results[:top_n]

    def find_best_matches_for_buyer(
        self,
        buyer: BuyerProcurement,
        farmers: List[FarmerListing],
        transporters: List[TransporterCapacity],
        top_n: int = 5,
    ) -> List[Tuple[float, FarmerListing, TransporterCapacity, Dict[str, Any]]]:
        results = []
        for f in farmers:
            for t in transporters:
                score, subs = self.score_triple(f, buyer, t)
                if score is not None:
                    results.append((score, f, t, subs))
        results.sort(key=lambda r: -r[0])
        return results[:top_n]

    def find_best_matches_for_transporter(
        self,
        transporter: TransporterCapacity,
        farmers: List[FarmerListing],
        buyers: List[BuyerProcurement],
        top_n: int = 5,
    ) -> List[Tuple[float, FarmerListing, BuyerProcurement, Dict[str, Any]]]:
        results = []
        for f in farmers:
            for b in buyers:
                score, subs = self.score_triple(f, b, transporter)
                if score is not None:
                    results.append((score, f, b, subs))
        results.sort(key=lambda r: -r[0])
        return results[:top_n]
