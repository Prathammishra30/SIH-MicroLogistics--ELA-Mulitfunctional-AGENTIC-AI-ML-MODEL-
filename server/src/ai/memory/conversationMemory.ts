// Multi-Turn Conversation Memory
// Temporary Session-Scoped State & Entity Accumulator

import type { CanonicalEntities } from '../ela/entities.js';
import type { GoalPlan } from '../ela/goals.js';

export interface ConversationTurnState {
  sessionId: string;
  userId?: string;
  lastIntent?: string;
  accumulatedEntities: CanonicalEntities;
  activeGoal?: GoalPlan | null;
  pendingConfirmationId?: string;
  lastUpdated: string;
}

export class ConversationMemory {
  private static sessionMap: Map<string, ConversationTurnState> = new Map();

  public static getSession(sessionId: string): ConversationTurnState {
    let session = this.sessionMap.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        accumulatedEntities: {},
        lastUpdated: new Date().toISOString(),
      };
      this.sessionMap.set(sessionId, session);
    }
    return session;
  }

  public static updateEntities(sessionId: string, newEntities: Partial<CanonicalEntities>): CanonicalEntities {
    const session = this.getSession(sessionId);
    session.accumulatedEntities = {
      ...session.accumulatedEntities,
      ...newEntities,
    };
    session.lastUpdated = new Date().toISOString();
    return session.accumulatedEntities;
  }

  public static setLastIntent(sessionId: string, intent: string): void {
    const session = this.getSession(sessionId);
    session.lastIntent = intent;
    session.lastUpdated = new Date().toISOString();
  }

  public static setActiveGoal(sessionId: string, goal: GoalPlan | null): void {
    const session = this.getSession(sessionId);
    session.activeGoal = goal;
    session.lastUpdated = new Date().toISOString();
  }

  public static clearSession(sessionId: string): void {
    this.sessionMap.delete(sessionId);
  }
}
