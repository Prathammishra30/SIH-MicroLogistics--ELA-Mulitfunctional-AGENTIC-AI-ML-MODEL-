# Learning & Self-Governance Package (Phase 7 + Phase 12.4 Continuous Intelligence)
from ai.ela.learning.collector import FeedbackCollector, TelemetryRecord
from ai.ela.learning.evaluator import GovernedModelEvaluator, ModelEvaluationReport
from ai.ela.learning.registry import ModelRegistry, ModelMetadata
from ai.ela.learning.governance import ModelGovernanceGate, GovernanceAuditReport, GovernanceDecision
from ai.ela.learning.pattern_miner import PatternMiner, PatternInsight, OperationalPattern
from ai.ela.learning.drift import DriftDetector, DriftAnalysisReport, DriftType
from ai.ela.learning.retraining import RetrainingTriggerEngine, RetrainingProposal, TriggerReason
from ai.ela.learning.error_analysis import (
    ErrorAnalysisEngine,
    OperationalDiscrepancy,
    ErrorAnalysisDiagnosis,
    ErrorCategory,
)
from ai.ela.learning.outcomes import ElaVerifiedOutcome, OutcomeManager, OutcomeLinkageChain
from ai.ela.learning.deviations import DeviationResult, DeviationAnalyzer, ErrorCategorizer
from ai.ela.learning.events import ElaLearningEvent, LearningEventManager
from ai.ela.learning.adaptation import ElaAdaptationProposal, AdaptationEngine, CorridorAdjustmentSignal

__all__ = [
    "FeedbackCollector",
    "TelemetryRecord",
    "GovernedModelEvaluator",
    "ModelEvaluationReport",
    "ModelRegistry",
    "ModelMetadata",
    "ModelGovernanceGate",
    "GovernanceAuditReport",
    "GovernanceDecision",
    "PatternMiner",
    "PatternInsight",
    "OperationalPattern",
    "DriftDetector",
    "DriftAnalysisReport",
    "DriftType",
    "RetrainingTriggerEngine",
    "RetrainingProposal",
    "TriggerReason",
    "ErrorAnalysisEngine",
    "OperationalDiscrepancy",
    "ErrorAnalysisDiagnosis",
    "ErrorCategory",
    "ElaVerifiedOutcome",
    "OutcomeManager",
    "OutcomeLinkageChain",
    "DeviationResult",
    "DeviationAnalyzer",
    "ErrorCategorizer",
    "ElaLearningEvent",
    "LearningEventManager",
    "ElaAdaptationProposal",
    "AdaptationEngine",
    "CorridorAdjustmentSignal",
]
