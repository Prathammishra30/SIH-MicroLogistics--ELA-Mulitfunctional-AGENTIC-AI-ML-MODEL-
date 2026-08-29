// ELA Agent State & Execution Trace Definitions (Phase 4 Enterprise Core)
// Defines strongly-typed agent state, confidence scores, execution traces, and observation steps

import type {
  UserRole,
  SupportedLanguage,
  ElaIntent,
  ElaNavigationAction,
  ElaConfirmationAction,
} from '../ela.types.js';
import type { CanonicalEntities } from './entities.js';
import type { GoalPlan, SubTask } from './goals.js';

export type AgentGoal = GoalPlan;
export type GoalSubtask = SubTask;

export interface ConfidenceScore {
  intentConfidence: number;
  entityConfidence: number;
  languageConfidence: number;
  roleConfidence: number;
  overallConfidence: number;
}

export interface SafetyCheckResult {
  credentialShielded: boolean;
  promptInjectionDetected: boolean;
  unauthorizedAttempt: boolean;
  rbacViolation: boolean;
  sanitized: boolean;
  warnings: string[];
}

export interface StepObservation {
  stepIndex: number;
  toolName: string;
  arguments: Record<string, unknown>;
  success: boolean;
  resultData?: unknown;
  error?: string;
  durationMs: number;
  timestamp: string;
}

export interface ElaAgentState {
  sessionId: string;
  traceId: string;
  userId?: string;
  authenticated: boolean;
  authenticatedRole: UserRole; // Authoritative role from backend JWT/Session (Used for RBAC)
  conversationalRole: UserRole; // Active conversational context role (Used for UI/Suggestions)
  language: SupportedLanguage;
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  currentIntent: ElaIntent;
  targetDomain: 'farmer' | 'buyer' | 'transporter' | 'universal' | 'auth';
  extractedEntities: CanonicalEntities;
  confidence: ConfidenceScore;
  safetyFlags: SafetyCheckResult;
  activeGoal?: GoalPlan | null;
  subtasks: SubTask[];
  currentTaskIndex: number;
  stepObservations: StepObservation[];
  pendingAction?: ElaConfirmationAction | null;
  navigationAction?: ElaNavigationAction | null;
  requiresConfirmation: boolean;
  clarificationNeeded: boolean;
  clarificationQuestion?: string | null;
  predictionContext?: Record<string, unknown>;
  memoryContext?: {
    frequentCrops?: string[];
    preferredMandi?: string;
    preferredPickupTime?: string;
    defaultVehicleType?: string;
  };
  iterations: number;
  status: 'INITIALIZING' | 'PLANNING' | 'EXECUTING' | 'WAITING_CONFIRMATION' | 'CLARIFYING' | 'COMPLETED' | 'FAILED';
}

export interface AgentExecutionTrace {
  traceId: string;
  sessionId: string;
  userId?: string;
  authenticatedRole: UserRole;
  conversationalRole: UserRole;
  language: SupportedLanguage;
  inputMessage: string;
  intent: ElaIntent;
  confidence: ConfidenceScore;
  plannerSteps: Array<{
    stepNumber: number;
    toolName: string;
    arguments: Record<string, unknown>;
    isMutation: boolean;
  }>;
  selectedTools: string[];
  toolResults: Array<{
    toolName: string;
    success: boolean;
    durationMs: number;
    error?: string;
  }>;
  modelProvider: string;
  modelVersion: string;
  totalLatencyMs: number;
  finalOutcome:
    | 'SUCCESS'
    | 'CLARIFICATION_REQUESTED'
    | 'CONFIRMATION_REQUIRED'
    | 'DENIED'
    | 'CREDENTIAL_SHIELDED'
    | 'ERROR';
  timestamp: string;
}
