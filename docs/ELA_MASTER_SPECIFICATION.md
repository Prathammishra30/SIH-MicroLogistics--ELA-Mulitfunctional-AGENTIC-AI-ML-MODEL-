# ELA Master Architectural Specification (Phases 12.1 – 12.3)
## Universal Brain, Transformer Core, Cognitive Memory, & Agentic Planning

---

### 1. High-Level Architecture

The ELA Universal Intelligence subsystem connects React UI and Node API Gateways with Spring Boot Java Authority and PostgreSQL:

```
React UI / Mobile PWA
        ↓ (HTTP / WebSocket)
Node API Gateway / Express Bridge
        ↓ (REST)
ELA Universal Brain (Python 3.14 Core)
  ├── Multilingual Intent & Entity Understanding (Indic NLU)
  ├── Security Guard & Credential Shield (Zero Secret Leakage)
  ├── Cognitive Memory Store & Evidentiary Provenance (8 Categories)
  ├── Transformer Neural Core (Custom 86k Param Attention Model)
  ├── Unified Cognitive Context Fusion
  ├── Agentic Planner (Machine-Executable DAG Generation)
  ├── Plan Evaluator (Acyclic, Capability, RBAC & Auth Auditing)
  ├── Controlled Plan Executor (Authorization Gates & Idempotency)
  ├── Specialized Multi-Agent Workers (Farmer, Buyer, Transporter, Logistics, Prediction, Risk, Market)
  ├── Closed-Loop Governed Self-Learning & Drift Detection
  └── Versioned Replanning Engine (Non-Destructive Plan Lineage)
        ↓ (Governed Tool Bridge)
Spring Boot Java Authority (backend-java)
        ↓ (JPA / Hibernate)
PostgreSQL Database
        ↓
Authoritative Verified Outcome
        ↓
Observation Engine & Memory Update
```

---

### 2. Subsystem Summary

#### Phase 12.1: Transformer Neural Core
- **Architecture**: 2-layer Multi-Head Self-Attention ($d_{model}=64, n_{heads}=4, d_{ff}=128, \text{vocab}=256$).
- **Parameters**: 86,609 parameters with causal masking and positional sinusoids.
- **Inference Latency**: $2.03 – 3.04$ ms forward pass.
- **Governance**: Tamper checksum validation and synthetic data quarantine.

#### Phase 12.2: Cognitive Memory & Context Fusion
- **8 Memory Categories**: `EPISODIC`, `SEMANTIC`, `GOAL`, `DECISION`, `OUTCOME`, `OPERATIONAL`, `CONSTRAINT`, `WARNING`.
- **Evidentiary Hierarchy**: `VERIFIED` (1.0), `USER_STATED` (0.95), `OBSERVED` (0.90), `PREDICTED` (0.70), `INFERRED` (0.60), `SYNTHETIC` (0.50).
- **Contradiction Resolution**: Strategy shifts supersede older constraints without corrupting historical decision records.
- **Tenant Boundaries**: Strict user and session isolation.

#### Phase 12.3: Agentic Planning Engine
- **Structured Plan DAG**: `ElaPlan` and `ElaPlanStep` models with machine-readable dependencies.
- **Pre-Execution Evaluator**: Validates completeness, DAG acyclicity, agent capabilities, authorization gates, and verification criteria.
- **Controlled Executor**: Executes ready steps in topological order; halts immediately at authorization gates.
- **Authoritative Verification**: Consequential mutations (`create_logistics_request`, `create_procurement`, etc.) require Java-generated entity IDs (`booking_id`) to succeed.
- **Versioned Replanning Engine**: When carriers become unavailable or strategies change, Plan v1 is preserved as an immutable audit record and Plan v2 is produced with parent lineage (`parent_version=1`).
- **Idempotency Protection**: Deterministic keys (`idemp-{plan_id}-{step_id}`) prevent duplicate execution.

#### Phase 12.4: Adaptive Execution & Closed-Loop Learning
- **Authoritative Verified Outcomes**: Requires Java Authority / PostgreSQL ground truth (`ElaVerifiedOutcome`); conversational texts or model predictions are never counted as verified outcomes.
- **Expected vs Actual Deviation Analysis**: Computes mathematical residuals ($Actual - Expected$) and percentage errors; categorizes into 8 root causes (`MODEL_ERROR`, `EXOGENOUS_EVENT`, `OPERATIONAL_FAILURE`, `DATA_DRIFT`, `CONTEXT_SHIFT`, etc.).
- **Normalized Learning Events**: Sanitized with `PrivacySanitizer` (zero credentials, zero passwords, redacted phone numbers); strictly isolates `REAL_OPERATIONAL` from `SYNTHETIC_TEST` streams.
- **Confidence-Gated Adaptation**: Low sample counts ($n < 5$) labeled `PRELIMINARY` to prevent premature mutation; $n \ge 10$ marked `STATISTICALLY_CONFIDENT`, generating formal `ElaAdaptationProposal` and `CorridorAdjustmentSignal`.
- **Governed Candidate Training & Promotion**: Strict anti-leakage temporal split, holdout benchmark evaluation, and `ModelGovernanceGate` requiring holdout MAE improvement ($\ge 1\%$).
- **Audited Rollback**: Production models can be rolled back to prior versions with an immutable entry in the rollback audit log.

---

### 3. Verification & Compliance Matrix

| Subsystem | Test Suite | Pass Count | Status |
| :--- | :--- | :--- | :--- |
| **Phase 12.1 Transformer Core** | `test_transformer_core.py` | 15 / 15 | **PASS** |
| **Phase 12.2 Cognitive Memory** | `test_cognitive_memory.py` | 11 / 11 | **PASS** |
| **Phase 12.3 Agentic Planning** | `test_agentic_planning.py` | 13 / 13 | **PASS** |
| **Phase 12.4 Adaptive Execution & Learning** | `test_adaptive_learning.py` | 17 / 17 | **PASS** |
| **Model Governance & Registry** | `test_governance.py` | 5 / 5 | **PASS** |
| **Neural Learners** | `test_neural_models.py` | 3 / 3 | **PASS** |
| **ML Models & Decision Support**| `test_ml_models.py` | 11 / 11 | **PASS** |
| **Universal Intelligence** | `test_phase10_universal_intelligence.py` | 13 / 13 | **PASS** |
| **Real Operational Intelligence**| `test_phase11_real_operational_intelligence.py` | 20 / 20 | **PASS** |
| **Full Regression Suite** | 23 Test Files (`ai/ela/tests/`) | **208 / 208 Passed (100%)** | **PASS** |
| **Master Runtime Verification** | `run_phase12_4_verification.py` | **6 / 6 Scenarios Passed** | **PASS** |
| **Full Live Stack QA** | `qa_full_stack_verification.py` | **24 / 24 Passed** | **PASS** |
| **Java Authority Backend** | `mvn test-compile -f backend-java/pom.xml` | `BUILD SUCCESS` | **PASS** |
| **Node API Gateway** | `npm run server:build` | `BUILD SUCCESS` | **PASS** |
| **React Web UI** | `npm run build` | `BUILD SUCCESS` | **PASS** |

