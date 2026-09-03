# ELA Phase 12.3: Agentic Planning Engine & Versioned Execution
## Master Architecture & Specification

---

### 1. Architectural Overview

Under **Phase 12.3**, ELA transitioned from a contextual understanding agent into a **true agentic system**:

```
                    ELA UNIVERSAL BRAIN
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      LLM Layer       Transformer       Cognitive
                     Neural Core         Memory
          │                │                │
          └────────────────┼────────────────┘
                           ↓
                  Unified Cognitive Context
                           ↓
                    AGENTIC PLANNER
                           │
                    ┌──────┴──────┐
                    ↓             ↓
              Plan Evaluator   Risk Analysis
                    │             │
                    └──────┬──────┘
                           ↓
                    Agent Coordinator
                           ↓
            ┌──────────────┼──────────────┐
            ↓              ↓              ↓
       FarmerAgent    LogisticsAgent   PredictionAgent
            ↓              ↓              ↓
                         Tools
                           ↓
                   Authorization Gate
                           ↓
                    Java Authority
                           ↓
                      PostgreSQL
                           ↓
                    Verified Outcome
                           ↓
                   Observation Engine
                           ↓
                   Memory + Goal State
                           ↓
                     REPLAN if needed
```

---

### 2. Structured Plan Model (`ElaPlan`)

Plans are represented by typed Pydantic models (`ai/ela/planner/models.py`), not free-form text:

```python
ElaPlan(
    plan_id="plan-d1274ddb",
    version=1,
    parent_version=None,
    goal_id="goal-101",
    session_id="session-farmer-01",
    user_id="farmer-101",
    status="AWAITING_AUTHORIZATION",
    objective="Arrange Transport for Tomatoes to Pune APMC Mandi",
    strategy="CHEAPEST",
    context_snapshot_id="ctx-9988",
    transformer_model_version="v1.0-transformer-core",
    planner_version="ela-agentic-planner-v12.3",
    steps=[...],
    constraints={"commodity": "Tomatoes", "strategy": "CHEAPEST"},
    risks=[{"risk": "High delay variance", "mitigation": "Highlight ETA trade-off"}],
    authorization_requirements=["User explicit approval required before staging or executing booking."],
    expected_outcome={"objective": "...", "transformer_readiness_score": 0.82},
    replan_reason=None,
    observation_trigger=None,
)
```

#### Plan Lifecycle States
- **`DRAFT`**: Initial assembly.
- **`READY`**: Evaluated and validated by `PlanEvaluator`.
- **`AWAITING_AUTHORIZATION`**: Halted safely at an authorization gate awaiting user consent.
- **`EXECUTING`**: Controlled step dispatch in progress.
- **`PAUSED`**: Temporarily suspended.
- **`REPLANNING`**: Invalidated and currently generating a new version.
- **`COMPLETED`**: All steps succeeded and authoritatively verified.
- **`FAILED`**: Step failed and unrecoverable without replan.
- **`CANCELLED`**: Revoked by user.
- **`INVALIDATED`**: Superseded by a newer plan version.
- **`EXPIRED`**: Stale execution context.

---

### 3. Structured Step Model (`ElaPlanStep`)

Every step has an explicit owning agent, governed tools, explicit dependencies, and clear authorization/verification gates:

```python
ElaPlanStep(
    step_id="plan-101-step-5",
    order=5,
    name="Commit Booking to Java Authority",
    objective="Execute booking request through Node bridge to Java Authority & PostgreSQL",
    owner_agent="LogisticsAgent",
    required_tools=["create_logistics_request"],
    inputs={"productName": "Tomatoes", "quantity": 500, "destination": "Pune"},
    expected_outputs={"booking_id": "req-authoritative"},
    dependencies=["plan-101-step-4"],
    risk_level="HIGH",
    authorization_required=True,
    evidence_required=True,
    verification_required=True,
    status="PENDING",
    idempotency_key="idemp-plan-101-step-5",
)
```

---

### 4. Dependency Graph & DAG Execution (`DependencyGraph`)

- **Cycle Detection**: Detects any circular dependencies ($\mathcal{O}(V + E)$ via DFS) and rejects invalid plans before execution.
- **Topological Sorting**: Determines the exact serial/parallel execution sequence.
- **Ready Step Resolution**: A step is only ready to execute when all its dependency step IDs have `status == 'SUCCEEDED'`.

---

### 5. Specialized Agent Delegation & Capability Registry (`AgentCapabilityRegistry`)

Plan steps are mapped strictly to specialized agents:
- **`FarmerAgent`**: Produce batch listing, inventory inspection, shipment staging.
- **`BuyerAgent`**: Procurement demand validation, bulk purchase posting.
- **`TransporterAgent`**: Vehicle fleet registration, trip bidding, earnings.
- **`LogisticsAgent`**: Multi-objective vehicle matching, route optimization, booking creation.
- **`PredictionAgent`**: Freight tariffs, transit ETA, commodity price forecasting.
- **`RiskAgent`**: Weather delays, carrier cancellations, perishable spoilage.
- **`MarketAgent`**: APMC Mandi commodity rates, market demand.

If an owning agent or required tool is missing, the step is marked `BLOCKED` and the plan is rejected during evaluation. Nonexistent capabilities are never hallucinated.

---

### 6. Pre-Execution Plan Evaluator (`PlanEvaluator`)

Before executing any plan, `PlanEvaluator` audits 6 dimensions:
1. **Completeness**: All required fields and steps defined.
2. **Dependency Validity**: DAG acyclicity and prerequisite reference integrity.
3. **Capability Availability**: Verification that agents and tools exist.
4. **Authorization Validity**: Guarantees that any consequential mutation has `authorization_required=True`.
5. **Verification Coverage**: Consequential mutations must require authoritative verification.
6. **Risk Assessment**: Classifies risk levels (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).

---

### 7. Controlled Execution Engine (`PlanExecutor`)

- Respects topological step order.
- **Authorization Gate Enforcement**: When encountering a step with `authorization_required=True`, execution halts immediately if `user_authorized=False`. The step becomes `WAITING` and the plan becomes `AWAITING_AUTHORIZATION`.
- **Consequential Mutation Path**:
  ```
  PlanExecutor -> NodeToolBridge -> Java Authority -> PostgreSQL -> Verified Booking ID
  ```

---

### 8. Observation Engine & Authoritative Verification (`ObservationEngine`)

- Captures structured observations (`ElaPlanObservation`) with expected output, actual result, evidence, and world state delta.
- **Authoritative Verification Rule**: A consequential mutation cannot be marked `SUCCEEDED` merely because an agent returned a text message. It requires a verified entity ID (e.g. `booking_id` or `procurement_id`) generated by the authoritative Java backend.

---

### 9. Versioned Replanning Engine (`ReplanningEngine`)

When an execution failure occurs (carrier unavailable, Java reports error) or the user changes constraints/strategy:
1. Current plan (v1) is marked `INVALIDATED` and preserved in audit history.
2. Plan v2 is generated with:
   - `plan_id = v1.plan_id`
   - `version = 2`
   - `parent_version = 1`
   - `replan_reason = "..."`
   - `observation_trigger = "..."`
3. Adapts the steps to the new operational state (e.g., excluding unavailable carriers, applying `HIGHEST_RELIABILITY` gates).
4. Re-evaluates Plan v2 before dispatch.

---

### 10. Idempotency & Duplicate Action Protection

Every consequential step generates a deterministic idempotency key:
```
idemp-{plan_id}-{step_id}
```
Passed to the Java Authority backend to prevent duplicate bookings or double billing on retries.

---

### 11. Security & Credential Shield

- Passwords, OTPs, PINs, and bearer tokens are intercepted by `SecurityGuard` and `PrivacySanitizer`.
- Authorization tokens are never inserted into plan steps, prompt text, or Transformer embeddings.

---

### 12. Verification & Performance Evidence

| Verification Dimension | Target | Result | Status |
| :--- | :--- | :--- | :--- |
| **Agentic Planning Test Suite** | 100% pass | **13 / 13 Passed** | **PASS** |
| **Cognitive Memory Suite** | Zero regressions | **11 / 11 Passed** | **PASS** |
| **Transformer Neural Suite** | Zero regressions | **15 / 15 Passed** | **PASS** |
| **Full AI Regression Suite** | Zero regressions | **91 / 91 Passed** | **PASS** |
| **Java Backend Build** | Zero compile errors | **BUILD SUCCESS** | **PASS** |
| **E2E #1 Plan DAG Creation** | Staged authorization | Halts at gate | **PASS** |
| **E2E #2 Authorized Execution** | Java verified booking | `booking_id` verified | **PASS** |
| **E2E #3 Execution Failure** | Versioned replan | v1 $\to$ v2 preserved | **PASS** |
| **E2E #4 Strategy Shift** | Multi-turn replanning | v1 $\to$ v2 $\to$ v3 preserved | **PASS** |
| **E2E #5 Multi-Role Isolation** | No cross-role leaks | Farmer vs Buyer vs Transporter | **PASS** |
| **Plan Generation Latency** | $< 5.0$ ms | **$< 1.0$ ms** | **PASS** |
| **Versioned Replanning Latency**| $< 2.0$ ms | **$0.18$ ms** | **PASS** |
