# AI Knowledge Engine (Phase 5 Core Intelligence Fusion)
# Curated Domain Knowledge Base for Agricultural Logistics, Mandis, and Regulatory Standards
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class CommodityFact(BaseModel):
    name: str
    category: str
    perishability: str  # HIGH, MODERATE, LOW
    shelf_life_days: int
    optimal_transit_hours: int
    handling_notes: str
    standard_units: List[str]


class MandiFact(BaseModel):
    name: str
    district: str
    state: str
    operating_hours: str
    primary_commodities: List[str]
    grading_standards: List[str]


class VehicleRule(BaseModel):
    vehicle_type: str
    max_payload_kg: float
    max_volume_cbm: float
    is_refrigerated_capable: bool
    terrain_suitability: str


class KnowledgeEngine:
    """
    Structured Domain Knowledge Base.
    Distinguishes static facts & business rules from real-time ML predictions and user statements.
    """
    def __init__(self):
        self._commodities: Dict[str, CommodityFact] = {
            "tomatoes": CommodityFact(
                name="Tomatoes",
                category="Vegetables",
                perishability="HIGH",
                shelf_life_days=5,
                optimal_transit_hours=12,
                handling_notes="Fragile skin; avoid excessive stacking (>4 crates high). Requires ventilated or refrigerated transit for trips >6h.",
                standard_units=["kg", "quintal", "crates", "tonnes"],
            ),
            "onions": CommodityFact(
                name="Onions",
                category="Vegetables",
                perishability="LOW",
                shelf_life_days=60,
                optimal_transit_hours=72,
                handling_notes="Requires dry, well-ventilated transport. High moisture causes sprouting.",
                standard_units=["kg", "quintal", "bags", "tonnes"],
            ),
            "potatoes": CommodityFact(
                name="Potatoes",
                category="Tubers",
                perishability="LOW",
                shelf_life_days=45,
                optimal_transit_hours=48,
                handling_notes="Protect from direct sunlight and heat exposure during mid-day transit.",
                standard_units=["kg", "quintal", "bags", "tonnes"],
            ),
            "wheat": CommodityFact(
                name="Wheat",
                category="Grains",
                perishability="LOW",
                shelf_life_days=365,
                optimal_transit_hours=120,
                handling_notes="Tarpaulin cover mandatory to prevent rain moisture damage.",
                standard_units=["kg", "quintal", "bags", "tonnes"],
            ),
            "grapes": CommodityFact(
                name="Grapes",
                category="Fruits",
                perishability="HIGH",
                shelf_life_days=7,
                optimal_transit_hours=8,
                handling_notes="High vibration sensitivity. Cushioning crates required.",
                standard_units=["kg", "boxes", "tonnes"],
            ),
        }

        self._mandis: Dict[str, MandiFact] = {
            "pune": MandiFact(
                name="Pune APMC Mandi",
                district="Pune",
                state="Maharashtra",
                operating_hours="04:00 AM - 02:00 PM",
                primary_commodities=["Tomatoes", "Onions", "Potatoes", "Vegetables"],
                grading_standards=["Grade A (Export/Premium)", "Grade B (Standard)", "Grade C (Processing)"],
            ),
            "nashik": MandiFact(
                name="Nashik APMC Mandi",
                district="Nashik",
                state="Maharashtra",
                operating_hours="05:00 AM - 01:00 PM",
                primary_commodities=["Onions", "Tomatoes", "Grapes", "Pomegranates"],
                grading_standards=["Grade A (Premium)", "Grade B (Commercial)"],
            ),
            "vashi": MandiFact(
                name="Vashi APMC Navi Mumbai",
                district="Thane",
                state="Maharashtra",
                operating_hours="03:00 AM - 12:00 PM",
                primary_commodities=["Vegetables", "Fruits", "Grains"],
                grading_standards=["Grade A (Super)", "Grade B (Regular)"],
            ),
        }

        self._vehicle_rules: Dict[str, VehicleRule] = {
            "mini truck": VehicleRule(
                vehicle_type="Mini Truck (750 kg)",
                max_payload_kg=750.0,
                max_volume_cbm=4.5,
                is_refrigerated_capable=False,
                terrain_suitability="Urban, rural village links, short hauls",
            ),
            "pickup": VehicleRule(
                vehicle_type="Pickup Van (1.5 Ton)",
                max_payload_kg=1500.0,
                max_volume_cbm=8.0,
                is_refrigerated_capable=False,
                terrain_suitability="Inter-district highways, ghats, mandi transit",
            ),
            "medium truck": VehicleRule(
                vehicle_type="Medium Truck (3.5 Ton)",
                max_payload_kg=3500.0,
                max_volume_cbm=18.0,
                is_refrigerated_capable=True,
                terrain_suitability="State highways, bulk mandi consolidation",
            ),
        }

    def get_commodity_info(self, commodity_name: str) -> Optional[CommodityFact]:
        if not commodity_name:
            return None
        c_lower = commodity_name.lower().strip()
        for k, v in self._commodities.items():
            if k in c_lower or c_lower in k:
                return v
        return None

    def get_mandi_info(self, mandi_query: str) -> Optional[MandiFact]:
        if not mandi_query:
            return None
        m_lower = mandi_query.lower().strip()
        for k, v in self._mandis.items():
            if k in m_lower or m_lower in k:
                return v
        return None

    def get_vehicle_rule(self, vehicle_query: str) -> Optional[VehicleRule]:
        if not vehicle_query:
            return None
        v_lower = vehicle_query.lower().strip()
        for k, v in self._vehicle_rules.items():
            if k in v_lower:
                return v
        return None

    def check_perishability_urgency(self, commodity_name: str, transit_hours: float) -> Tuple[bool, str]:
        c_fact = self.get_commodity_info(commodity_name)
        if not c_fact:
            return False, "Standard transit"

        if c_fact.perishability == "HIGH" and transit_hours > (c_fact.optimal_transit_hours / 2.0):
            return True, f"High perishability alert: {c_fact.name} transit ({transit_hours:.1f}h) approaches optimal limit ({c_fact.optimal_transit_hours}h). Fast transit prioritized."
        return False, "Transit duration well within commodity quality limits."
