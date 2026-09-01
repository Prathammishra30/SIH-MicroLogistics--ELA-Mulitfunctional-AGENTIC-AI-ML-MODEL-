# Operational Risk & Reliability ML Models Unit Tests (Phase 6 Universal Intelligence Fusion)
import pytest
from ai.ela.ml.models.risk import (
    DelayProbabilityModel,
    DelayRiskFeatures,
    CancellationProbabilityModel,
    CancellationRiskFeatures,
    DeliverySuccessProbabilityModel,
    DeliverySuccessFeatures,
)


@pytest.mark.asyncio
async def test_delay_probability_model():
    model = DelayProbabilityModel()
    assert model.model_name == "DelayProbabilityModel"
    assert model.status == "trained"

    # 1. Normal route
    res_normal = await model.predict(
        DelayRiskFeatures(distance_km=210.0, departure_hour=6, weather_risk_index=0.1)
    )
    assert 0.0 <= res_normal.prediction.delay_probability <= 1.0
    assert res_normal.prediction.risk_level in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert res_normal.confidence >= 0.80

    # 2. Peak hour & bad weather -> Higher delay risk
    res_high = await model.predict(
        DelayRiskFeatures(distance_km=450.0, departure_hour=18, weather_risk_index=0.8, checkpoint_count=4)
    )
    assert res_high.prediction.delay_probability > res_normal.prediction.delay_probability
    assert res_high.prediction.expected_delay_minutes > res_normal.prediction.expected_delay_minutes


@pytest.mark.asyncio
async def test_cancellation_probability_model():
    model = CancellationProbabilityModel()
    
    # 1. High rating driver
    res_good = await model.predict(CancellationRiskFeatures(transporter_rating=4.9, price_spread_pct=0.02))
    assert res_good.prediction.cancellation_probability < 0.20
    assert res_good.prediction.risk_level == "LOW"

    # 2. Low rating driver & big price gap
    res_risky = await model.predict(CancellationRiskFeatures(transporter_rating=3.2, price_spread_pct=0.25))
    assert res_risky.prediction.cancellation_probability > res_good.prediction.cancellation_probability


@pytest.mark.asyncio
async def test_delivery_success_probability_model():
    model = DeliverySuccessProbabilityModel()
    
    res = await model.predict(
        DeliverySuccessFeatures(
            distance_km=210.0,
            cargo_weight_kg=500.0,
            vehicle_capacity_kg=750.0,
            transporter_reliability_score=0.96,
            delay_risk=0.12,
            cancellation_risk=0.05,
        )
    )
    assert 0.80 <= res.prediction.success_probability <= 1.0
    assert res.prediction.reliability_tier == "TIER_1_GUARANTEED"
    assert res.confidence >= 0.90
