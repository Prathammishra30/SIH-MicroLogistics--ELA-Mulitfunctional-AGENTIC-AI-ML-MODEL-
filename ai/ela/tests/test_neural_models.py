# Neural Intelligence Layer Unit Tests (Phase 6 Universal Intelligence Fusion)
import pytest
import numpy as np
from ai.ela.neural.models import (
    NeuralFeatureTensor,
    NeuralRouteDelayLearner,
    NeuralTransporterReliabilityScorer,
    NeuralEvaluationMetrics,
)


def test_neural_feature_tensor_operations():
    raw_data = np.array([
        [210.0, 8.0, 2.0, 30.0, 2.0, 0.35],
        [150.0, 14.0, 1.0, 20.0, 1.0, 0.20],
        [80.0, 9.0, 4.0, 45.0, 3.0, 0.50],
    ], dtype=np.float32)

    tensor = NeuralFeatureTensor(raw_data, feature_names=["dist", "hour", "dow", "load", "checks", "cong"])
    assert tensor.data.shape == (3, 6)
    assert len(tensor.feature_names) == 6

    norm_tensor = tensor.normalize()
    assert norm_tensor.data.shape == (3, 6)
    # Mean across columns should be approximately 0
    assert np.allclose(np.mean(norm_tensor.data, axis=0), 0.0, atol=1e-4)


def test_neural_route_delay_learner_training_and_serialization():
    learner = NeuralRouteDelayLearner(version="v1.0-test-mlp", learning_rate=0.01)
    assert learner.status == "initialized"

    # Synthetic training batch: 20 samples with 6 features
    np.random.seed(42)
    X_train = np.random.uniform(10.0, 100.0, (20, 6)).astype(np.float32)
    # Synthetic target delay (minutes)
    y_train = (0.2 * X_train[:, 0] + 0.5 * X_train[:, 3] + 5.0).astype(np.float32)

    # Train model
    metrics = learner.fit(X_train, y_train, epochs=30, batch_size=4)
    assert learner.status == "trained"
    assert metrics.sample_count == 20
    assert metrics.mae >= 0.0

    # Predict
    test_sample = NeuralFeatureTensor(X_train[:1])
    pred_delay = learner.predict(test_sample)
    assert pred_delay >= 0.0

    # Weight serialization & loading
    weights_dump = learner.serialize_weights()
    assert "W1" in weights_dump
    assert "W2" in weights_dump
    assert "W3" in weights_dump

    fresh_learner = NeuralRouteDelayLearner()
    fresh_learner.load_weights(weights_dump)
    assert fresh_learner.status == "trained"
    pred_loaded = fresh_learner.predict(test_sample)
    assert np.isclose(pred_delay, pred_loaded, atol=1e-5)


def test_neural_transporter_reliability_scorer():
    scorer = NeuralTransporterReliabilityScorer()
    
    # High performance driver
    score_high = scorer.score_reliability(
        completion_rate=0.99,
        punctuality_score=0.95,
        maintenance_score=0.92,
        rating=4.9,
    )
    assert 0.0 <= score_high <= 1.0

    # Poor performance driver
    score_low = scorer.score_reliability(
        completion_rate=0.60,
        punctuality_score=0.50,
        maintenance_score=0.40,
        rating=2.1,
    )
    assert 0.0 <= score_low <= 1.0
    assert score_high > score_low
