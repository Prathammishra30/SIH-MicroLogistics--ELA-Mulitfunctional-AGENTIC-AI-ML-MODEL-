# ELA Pre-Execution Plan Evaluator (Phase 12.3)
from typing import List, Set
from ai.ela.planner.models import ElaPlan, ElaPlanEvaluation, DependencyGraph
from ai.ela.planner.capabilities import AgentCapabilityRegistry
from ai.ela.tools.registry import ToolRegistry


class PlanEvaluator:
    """
    Evaluates a structured execution plan before dispatching it.
    Audits DAG acyclicity, capability availability, authorization requirements,
    and verification coverage.
    """

    CONSEQUENTIAL_TOOLS = {
        'create_logistics_request',
        'create_procurement',
        'create_product',
        'create_vehicle',
    }

    @classmethod
    def evaluate(cls, plan: ElaPlan) -> ElaPlanEvaluation:
        blocking_issues: List[str] = []
        warnings: List[str] = []
        unmet_constraints: List[str] = []
        missing_capabilities: List[str] = []
        authorization_gaps: List[str] = []
        verification_gaps: List[str] = []

        # 1. Completeness Check
        if not plan.steps:
            blocking_issues.append("Plan contains zero steps.")

        step_ids: Set[str] = {s.step_id for s in plan.steps}

        # 2. Dependency Graph & Cycle Detection
        if DependencyGraph.detect_cycles(plan.steps):
            blocking_issues.append("Circular dependency detected in plan steps DAG.")

        for step in plan.steps:
            for dep in step.dependencies:
                if dep not in step_ids:
                    blocking_issues.append(f"Step '{step.name}' references nonexistent dependency '{dep}'.")

        # 3. Capability Verification
        for step in plan.steps:
            valid, err = AgentCapabilityRegistry.validate_step_capability(step.owner_agent, step.required_tools)
            if not valid:
                missing_capabilities.append(f"Step '{step.name}': {err}")
                blocking_issues.append(f"Missing capability for step '{step.name}': {err}")

        # 4. Authorization Gates
        for step in plan.steps:
            has_consequential_tool = any(t in cls.CONSEQUENTIAL_TOOLS for t in step.required_tools)
            if has_consequential_tool:
                if not step.authorization_required:
                    authorization_gaps.append(f"Consequential step '{step.name}' missing authorization_required=True.")
                    blocking_issues.append(f"Security violation: Step '{step.name}' mutates state without authorization gate.")

        # 5. Verification Coverage
        for step in plan.steps:
            has_consequential_tool = any(t in cls.CONSEQUENTIAL_TOOLS for t in step.required_tools)
            if has_consequential_tool and not step.verification_required:
                verification_gaps.append(f"Step '{step.name}' performs mutation without verification_required=True.")
                warnings.append(f"Warning: Consequential step '{step.name}' should have explicit verification.")

        # 6. Risk Summary
        has_high_risk = any(s.risk_level in ['HIGH', 'CRITICAL'] for s in plan.steps)
        risk_summary = "HIGH_RISK" if has_high_risk else "LOW_TO_MODERATE_RISK"

        is_valid = len(blocking_issues) == 0

        return ElaPlanEvaluation(
            plan_id=plan.plan_id,
            valid=is_valid,
            blocking_issues=blocking_issues,
            warnings=warnings,
            unmet_constraints=unmet_constraints,
            missing_capabilities=missing_capabilities,
            authorization_gaps=authorization_gaps,
            verification_gaps=verification_gaps,
            risk_summary=risk_summary,
        )
