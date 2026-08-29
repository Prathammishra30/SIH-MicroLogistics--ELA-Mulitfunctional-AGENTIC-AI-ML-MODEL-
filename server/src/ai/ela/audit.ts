// ELA Audit & Execution Tracing Subsystem (Phase 4 Intelligence Core)
// Sanitized audit logger and execution trace repository for enterprise observability

import type { UserRole } from '../ela.types.js';
import type { AgentExecutionTrace } from './state.types.js';

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId?: string;
  role: UserRole;
  agent: 'ELA';
  intent: string;
  toolName?: string;
  actionStatus: 'CONFIRMED' | 'STAGED' | 'DENIED' | 'EXECUTED' | 'FAILED' | 'SECURITY_SHIELDED';
  sanitizedSummary: string;
  metadata?: Record<string, unknown>;
  modelVersion?: string;
}

export class AuditLogger {
  private static auditLogs: AuditEvent[] = [];
  private static traces: Map<string, AgentExecutionTrace> = new Map();

  public static logAction(event: Omit<AuditEvent, 'id' | 'timestamp' | 'agent'>): AuditEvent {
    const fullEvent: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      agent: 'ELA',
      ...event,
      sanitizedSummary: this.sanitizeText(event.sanitizedSummary),
    };

    this.auditLogs.unshift(fullEvent);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }

    return fullEvent;
  }

  public static recordTrace(trace: AgentExecutionTrace): void {
    this.traces.set(trace.traceId, trace);
  }

  public static getTrace(traceId: string): AgentExecutionTrace | undefined {
    return this.traces.get(traceId);
  }

  public static getRecentAuditLogs(limit = 50): AuditEvent[] {
    return this.auditLogs.slice(0, limit);
  }

  private static sanitizeText(text: string): string {
    return text
      .replace(/password\s*[:=]\s*\S+/gi, 'password=[REDACTED]')
      .replace(/otp\s*[:=]\s*\S+/gi, 'otp=[REDACTED]')
      .replace(/token\s*[:=]\s*\S+/gi, 'token=[REDACTED]')
      .replace(/\b\d{6}\b/g, '[OTP/PIN_REDACTED]');
  }
}
