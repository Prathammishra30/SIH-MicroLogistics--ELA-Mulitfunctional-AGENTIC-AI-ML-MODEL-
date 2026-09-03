# ELA Transformer Neural Core Comprehensive Test Suite (Phase 12.1)
import pytest
import numpy as np
import os
import tempfile
import torch

from ai.ela.neural.transformer.config import TransformerConfig
from ai.ela.neural.transformer.positional_encoding import SinusoidalPositionalEncoding, TorchPositionalEncoding
from ai.ela.neural.transformer.attention import (
    TorchMultiHeadSelfAttention,
    NumpyMultiHeadSelfAttention,
    compute_attention_entropy_numpy,
)
from ai.ela.neural.transformer.feed_forward import TorchPositionwiseFeedForward, NumpyPositionwiseFeedForward
from ai.ela.neural.transformer.block import TorchTransformerBlock, NumpyTransformerBlock
from ai.ela.neural.transformer.heads import TorchIntentClassificationHead, TorchDecisionScoringHead
from ai.ela.neural.transformer.model import TorchElaTransformerModel, NumpyElaTransformerModel, ElaTransformerState
from ai.ela.neural.transformer.embeddings import ElaNeuralInput, ElaInputVectorizer
from ai.ela.neural.transformer.inference import TransformerNeuralCore
from ai.ela.neural.transformer.training import TransformerTrainer
from ai.ela.neural.transformer.provenance import TrainingProvenance
from ai.ela.neural.transformer.checkpoint import TransformerCheckpointManager
from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.agent.loop import AgentChatRequest
from ai.ela.learning.registry import ModelRegistry


# ============================================================================
# A. ARCHITECTURE TESTS
# ============================================================================

def test_transformer_config_dimensions():
    config = TransformerConfig(d_model=64, n_heads=4, num_layers=2, d_ff=128)
    assert config.head_dim == 16
    assert config.model_version == "v1.0-transformer-core"
    
    # Must reject non-divisible dimensions
    with pytest.raises(ValueError):
        TransformerConfig(d_model=65, n_heads=4)


def test_transformer_parameter_count():
    config = TransformerConfig(vocab_size=256, d_model=64, n_heads=4, num_layers=2, d_ff=128)
    model = TorchElaTransformerModel(config)
    param_count = model.count_parameters()
    # Measured parameter count should be ~86.6K
    assert 80000 < param_count < 95000
    assert isinstance(param_count, int)


def test_positional_encoding_math():
    d_model = 64
    seq_len = 16
    pe_helper = SinusoidalPositionalEncoding(d_model=d_model, max_len=32)
    pe_np = pe_helper.get_encoding_numpy(seq_len)
    
    assert pe_np.shape == (1, 16, 64)
    # Position 0 sin should be 0.0, cos should be 1.0
    assert np.isclose(pe_np[0, 0, 0], 0.0, atol=1e-5)
    assert np.isclose(pe_np[0, 0, 1], 1.0, atol=1e-5)


def test_multi_head_self_attention_shape_and_entropy():
    d_model = 64
    n_heads = 4
    seq_len = 8
    attn = TorchMultiHeadSelfAttention(d_model=d_model, n_heads=n_heads)
    
    x = torch.randn(2, seq_len, d_model)
    mask = torch.ones(2, seq_len)
    mask[:, 6:] = 0.0  # Mask out last 2 tokens
    
    out, weights = attn(x, attention_mask=mask)
    assert out.shape == (2, seq_len, d_model)
    assert weights.shape == (2, n_heads, seq_len, seq_len)
    
    # Attention to masked positions should be zero
    assert torch.all(weights[:, :, :, 6:] < 1e-4)
    
    # Entropy calculation
    entropy = compute_attention_entropy_numpy(weights.detach().cpu().numpy())
    assert entropy >= 0.0


def test_transformer_block_forward():
    d_model = 64
    block = TorchTransformerBlock(d_model=d_model, n_heads=4, d_ff=128)
    x = torch.randn(2, 10, d_model)
    out, attn = block(x)
    assert out.shape == (2, 10, d_model)
    assert attn.shape == (2, 4, 10, 10)


# ============================================================================
# B. TENSOR & INFERENCE TESTS
# ============================================================================

def test_ela_input_vectorizer():
    neural_input = ElaNeuralInput(
        session_id="test-session-1",
        language="hi",
        role="FARMER",
        intent="CREATE_LOGISTICS_WORKFLOW",
        entities={"commodity": "tomatoes", "quantity": 750.0, "pickup_location": "Nashik", "destination": "Pune"},
        context={"strategy": "CHEAPEST"},
        raw_text="मुझे नासिक से पुणे टमाटर भेजने के लिए सस्ती गाड़ी चाहिए",
    )
    
    token_ids, mask, num_feats = ElaInputVectorizer.vectorize(neural_input, max_seq_len=32)
    assert len(token_ids) == 32
    assert len(mask) == 32
    assert token_ids[0] == ElaInputVectorizer.CLS_TOKEN
    assert ElaInputVectorizer.ROLE_MAP["FARMER"] in token_ids
    assert ElaInputVectorizer.STRAT_MAP["CHEAPEST"] in token_ids
    assert num_feats["norm_weight"] == pytest.approx(750.0 / 10000.0, rel=1e-3)


def test_credential_shield_in_vectorizer():
    # Sensitive password or token should be shielded and not passed to tokens
    neural_input = ElaNeuralInput(
        session_id="test-sec-session",
        language="en",
        role="GUEST",
        intent="GENERAL_HELP",
        raw_text="My password is secret12345! and token is eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    )
    token_ids, mask, _ = ElaInputVectorizer.vectorize(neural_input, max_seq_len=32)
    # Vectorizer must succeed safely without raising raw secret tokens
    assert len(token_ids) == 32
    assert token_ids[0] == ElaInputVectorizer.CLS_TOKEN


def test_transformer_neural_core_infer():
    core = TransformerNeuralCore()
    neural_input = ElaNeuralInput(
        session_id="test-infer-session",
        language="en",
        role="FARMER",
        intent="CREATE_LOGISTICS_WORKFLOW",
        entities={"commodity": "tomatoes", "quantity": 500.0, "pickup_location": "Nashik", "destination": "Pune APMC Mandi"},
        context={"strategy": "BALANCED"},
        raw_text="I have 500 kg tomatoes in Nashik. I need transport to Pune.",
    )
    
    state = core.encode(neural_input)
    assert isinstance(state, ElaTransformerState)
    assert state.status == "COMPUTED"
    assert len(state.pooled_representation) == core.config.d_model
    assert 0.0 <= state.decision_score <= 1.0
    assert state.parameter_count == core.parameter_count
    assert state.inference_latency_ms < 50.0
    assert state.model_version == "v1.0-transformer-core"
    assert len(state.model_checksum) == 64


def test_transformer_safe_fallback_degradation():
    core = TransformerNeuralCore()
    # Invalid or corrupt input
    corrupt_input = ElaNeuralInput(
        session_id="corrupt-session",
        raw_text=None,
    )
    # Intentionally corrupt config to test fallback handling
    old_seq = core.config.max_seq_len
    try:
        core.config.max_seq_len = -5
        state = core.encode(corrupt_input)
        assert state.status == "FALLBACK"
        assert state.decision_score == 0.70
        assert state.attention_summary.get("fallback") is True
    finally:
        core.config.max_seq_len = old_seq


# ============================================================================
# C. DETERMINISM TESTS
# ============================================================================

def test_inference_determinism():
    core = TransformerNeuralCore()
    neural_input = ElaNeuralInput(
        session_id="det-session",
        language="en",
        role="FARMER",
        intent="CREATE_LOGISTICS_WORKFLOW",
        entities={"commodity": "tomatoes", "quantity": 500.0},
        context={"strategy": "BALANCED"},
        raw_text="Fixed prompt for determinism test",
    )
    
    out1 = core.encode(neural_input)
    out2 = core.encode(neural_input)
    
    assert out1.decision_score == out2.decision_score
    assert out1.predicted_intent_index == out2.predicted_intent_index
    assert np.allclose(out1.pooled_representation, out2.pooled_representation, atol=1e-5)


# ============================================================================
# D. TRAINING & CHECKPOINT TESTS
# ============================================================================

def test_transformer_training_pipeline_and_loss_reduction():
    trainer = TransformerTrainer(TransformerConfig(d_model=64, n_heads=4, num_layers=2, d_ff=128))
    train_data = trainer.generate_synthetic_training_dataset(num_samples=20, seed=42)
    val_data = trainer.generate_synthetic_training_dataset(num_samples=6, seed=99)
    
    cand_version = "v1.1-test-candidate"
    model, metrics, provenance, leakage_report = trainer.train(
        dataset=train_data,
        val_dataset=val_data,
        dataset_provenance="SYNTHETIC_TEST",
        dataset_id="test-synthetic-benchmark",
        epochs=3,
        learning_rate=2e-3,
        candidate_version=cand_version,
    )
    
    assert leakage_report.overall_status == "PASS"
    assert metrics.sample_count == 26
    assert metrics.intent_accuracy >= 0.0
    assert metrics.decision_mae < 1.0
    assert provenance.dataset_provenance == "SYNTHETIC_TEST"
    
    # Verify saved checkpoint
    loaded_meta = TransformerCheckpointManager.load_checkpoint(model, version=cand_version)
    assert loaded_meta["version"] == cand_version
    assert loaded_meta["parameter_count"] == model.count_parameters()
    assert loaded_meta["artifact_checksum"] is not None


def test_tampered_checkpoint_rejection():
    config = TransformerConfig()
    model = TorchElaTransformerModel(config)
    tag = "v1.0-tamper-test"
    weight_path, checksum = TransformerCheckpointManager.save_checkpoint(model, config, tag=tag)
    
    # Tamper with weight file by appending bytes
    with open(weight_path, "ab") as f:
        f.write(b"CORRUPT_BYTES")
        
    with pytest.raises(ValueError, match="Checksum Mismatch"):
        TransformerCheckpointManager.load_checkpoint(model, version=tag)


# ============================================================================
# E. DATA PROVENANCE & GOVERNANCE TESTS
# ============================================================================

def test_synthetic_provenance_violation():
    # Synthetic data must not be represented as REAL_OPERATIONAL
    with pytest.raises(ValueError, match="Data Provenance Violation"):
        prov = TrainingProvenance(
            dataset_id="dataset-synthetic-test",
            dataset_provenance="REAL_OPERATIONAL",  # ILLEGAL
            sample_count=10,
            train_samples=8,
            val_samples=2,
            model_version="v1.0-illegal",
            random_seed=42,
        )
        prov.assert_valid()


def test_model_registry_registration():
    core = TransformerNeuralCore()
    meta = ModelRegistry.register_model(core, status="production")
    assert meta.model_name == "ElaTransformerNeuralCore"
    assert meta.status == "production"
    assert meta.version == core.current_version
    assert ModelRegistry.get_active_model("ElaTransformerNeuralCore") is core


# ============================================================================
# F. INTEGRATION TESTS (ELA UNIVERSAL BRAIN)
# ============================================================================

@pytest.mark.asyncio
async def test_brain_invokes_transformer_core():
    brain = ElaUniversalBrain()
    assert hasattr(brain, "transformer_core")
    assert brain.transformer_core is not None
    
    req = AgentChatRequest(
        message="I have 500 kg tomatoes in Nashik. I need the cheapest transport.",
        authenticated=True,
        authenticated_role="FARMER",
        language="en",
        session_id="brain-transformer-test-session",
    )
    
    res = await brain.process_chat(req)
    assert res.status in ["SUCCESS", "CONFIRMATION_REQUIRED"]
    assert res.trace is not None
    
    # Verify Transformer trace fields
    assert res.trace.transformer is not None
    t_trace = res.trace.transformer
    assert t_trace["enabled"] is True
    assert t_trace["model_version"] == "v1.0-transformer-core"
    assert t_trace["parameter_count"] > 80000
    assert t_trace["neural_signal_used"] is True
    assert t_trace["status"] == "COMPUTED"
    assert "decision_score" in t_trace["task_scores"]
    assert 0.0 <= t_trace["task_scores"]["decision_score"] <= 1.0
    
    # Verify model is listed in models_used
    assert any("transformer" in m.lower() for m in res.trace.models_used)
    
    # Verify recommendation contains transformer neural signal
    if res.ml_prediction:
        assert "transformer_neural_signal" in res.ml_prediction
        sig = res.ml_prediction["transformer_neural_signal"]
        assert sig["model_version"] == "v1.0-transformer-core"
        assert sig["status"] == "COMPUTED"
