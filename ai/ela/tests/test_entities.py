# Unit Tests for Canonical Entity Extraction (Phase 4 Python Core)
import pytest
from ai.ela.entities.extractor import EntityExtractor


def test_indic_and_devanagari_numerals():
    # Marathi: २ टन कांदा
    e1 = EntityExtractor.extract_entities("मला २ टन कांदा मुंबई बाजारपेठेत पाठवायचा आहे")
    assert e1.product == "Onions"
    assert e1.quantity == 2.0
    assert e1.unit == "ton"
    assert e1.destination == "Mumbai Vashi Market"

    # Hindi: ५०० किलो गेहूँ
    e2 = EntityExtractor.extract_entities("मुझे ५०० किलो गेहूँ पुणे मंडी भेजना है")
    assert e2.product == "Wheat"
    assert e2.quantity == 500.0
    assert e2.unit == "kg"
    assert e2.destination == "Pune APMC Mandi"


def test_tamil_and_telugu_extraction():
    # Tamil: 1000 கிலோ தக்காளி
    e1 = EntityExtractor.extract_entities("எனக்கு 1000 கிலோ தக்காளி ₹35 விலையில் வேண்டும்")
    assert e1.product == "Tomatoes"
    assert e1.quantity == 1000.0

    # Telugu: 50 క్వింటా బంగాళాదుంప
    e2 = EntityExtractor.extract_entities("నాకు 50 క్వింటా బంగాళాదుంప కావాలి")
    assert e2.product == "Potatoes"
    assert e2.quantity == 50.0
    assert e2.unit == "quintal"


def test_vehicle_extraction():
    e1 = EntityExtractor.extract_entities("Register Mini Truck MH 12 AB 9876 with 750 kg capacity")
    assert e1.vehicle_type == "Mini Truck (750 kg)"
    assert e1.vehicle_reg_no == "MH 12 AB 9876"
