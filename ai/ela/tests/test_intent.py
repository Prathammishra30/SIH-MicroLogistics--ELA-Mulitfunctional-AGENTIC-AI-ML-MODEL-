# Unit Tests for Multilingual Intent Resolution (Phase 4 Python Core)
import pytest
from ai.ela.intent.resolver import IntentResolver


def test_farmer_intents():
    res1 = IntentResolver.resolve("Show all my products and crops", current_role="FARMER")
    assert res1.intent == "GET_FARMER_PRODUCTS"
    assert res1.target_role == "FARMER"

    res2 = IntentResolver.resolve("Mera sabhi fasal aur product dikhao", current_role="FARMER", preferred_language="hi")
    assert res2.intent == "GET_FARMER_PRODUCTS"

    res3 = IntentResolver.resolve("Add 500 kg Tomatoes Grade A to inventory", current_role="FARMER")
    assert res3.intent == "CREATE_PRODUCT_WORKFLOW"


def test_buyer_intents():
    res1 = IntentResolver.resolve("Browse available farmer produce catalog", current_role="BUYER")
    assert res1.intent == "GET_BUYER_PRODUCE"
    assert res1.target_role == "BUYER"

    res2 = IntentResolver.resolve("Mujhe 500 kg tamatar kharidna hai", current_role="BUYER", preferred_language="hi")
    assert res2.intent == "CREATE_PROCUREMENT_WORKFLOW"


def test_transporter_intents():
    res1 = IntentResolver.resolve("Find nearby available loads and trips", current_role="TRANSPORTER")
    assert res1.intent == "GET_AVAILABLE_TRIPS"
    assert res1.target_role == "TRANSPORTER"

    res2 = IntentResolver.resolve("Show my registered trucks and vehicles", current_role="TRANSPORTER")
    assert res2.intent == "GET_VEHICLES"


def test_role_declaration_and_switching():
    res1 = IntentResolver.resolve("I am a farmer")
    assert res1.intent == "ROLE_DECLARATION"
    assert res1.target_role == "FARMER"

    res2 = IntentResolver.resolve("मी शेतकरी आहे", preferred_language="mr")
    assert res2.intent == "ROLE_DECLARATION"
    assert res2.target_role == "FARMER"
