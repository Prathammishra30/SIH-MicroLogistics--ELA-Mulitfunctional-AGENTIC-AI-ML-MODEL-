// ELA Security Layer & Sensitive Credential Shield
// Enforces zero-exposure credential protection, RBAC validation, and audit logging

import type { UserRole } from '../ela.types.js';

export interface SecurityAuditRecord {
  timestamp: string;
  userId?: string;
  role: UserRole;
  toolName?: string;
  actionStatus: 'PERMITTED' | 'DENIED' | 'CREDENTIAL_SHIELDED';
  sanitizedSummary: string;
}

export class SecurityGuard {
  private static auditLogs: SecurityAuditRecord[] = [];

  // Patterns that match sensitive authentication secrets
  private static sensitiveRegex =
    /\b(password|passcode|secret|otp|verification code|pin|123456|cvv|jwt|bearer token|auth_token)\b/i;

  /**
   * Evaluates if text contains sensitive authentication secrets
   */
  public static containsSensitiveCredentials(text: string): boolean {
    return this.sensitiveRegex.test(text);
  }

  /**
   * Sanitizes payload by stripping sensitive credential keys
   */
  public static sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (this.sensitiveRegex.test(key)) {
        clean[key] = '[REDACTED_SECRET]';
      } else if (typeof value === 'string' && this.sensitiveRegex.test(value)) {
        clean[key] = '[REDACTED_SECRET]';
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  /**
   * Enforces Role-Based Access Control (RBAC)
   */
  public static validateRolePermission(
    userRole: UserRole,
    allowedRoles: UserRole[]
  ): { permitted: boolean; reason?: string } {
    if (allowedRoles.includes('GUEST') || allowedRoles.includes(userRole)) {
      return { permitted: true };
    }
    return {
      permitted: false,
      reason: `Access Denied: Action requires ${allowedRoles.join(' or ')}, but current session role is ${userRole}.`,
    };
  }

  /**
   * Records secure audit log entry without exposing credentials
   */
  public static logAudit(record: SecurityAuditRecord): void {
    this.auditLogs.push(record);
    if (this.auditLogs.length > 500) {
      this.auditLogs.shift();
    }
  }

  public static getAuditLogs(): SecurityAuditRecord[] {
    return [...this.auditLogs];
  }
}
