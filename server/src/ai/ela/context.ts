// ELA Execution Context Builder
// Unifies session state, client context, authenticated user, and multi-turn memory

import type { AuthUser } from '../../modules/auth/auth.types.js';
import type { ElaClientContext, ElaExecutionContext, SupportedLanguage, UserRole } from '../ela.types.js';
import { ConversationMemory } from '../memory/conversationMemory.js';
import { UserMemory } from '../memory/userMemory.js';

export interface EnrichedExecutionContext extends ElaExecutionContext {
  sessionId: string;
  userPreferences?: ReturnType<typeof UserMemory.getPreferences>;
  conversationState?: ReturnType<typeof ConversationMemory.getSession>;
}

export class ContextManager {
  public static buildContext(
    clientContext?: ElaClientContext,
    authUser?: AuthUser | null,
    sessionId?: string
  ): EnrichedExecutionContext {
    const activeSessionId = sessionId || (authUser ? `sess-user-${authUser.id}` : `sess-guest-${Date.now()}`);
    const effectiveRole: UserRole = authUser?.role || 'GUEST';

    const clientLang = (clientContext?.language || 'en') as SupportedLanguage;
    const supportedLangs: SupportedLanguage[] = ['en', 'hi', 'mr', 'ta', 'te', 'bn', 'kn'];
    const validLang: SupportedLanguage = supportedLangs.includes(clientLang) ? clientLang : 'en';

    const userPreferences = authUser ? UserMemory.getPreferences(authUser.id) : undefined;
    const conversationState = ConversationMemory.getSession(activeSessionId);

    return {
      authenticatedUser: authUser || null,
      role: effectiveRole,
      language: validLang,
      currentPage: clientContext?.currentPage || '/',
      confirmed: false,
      sessionId: activeSessionId,
      userPreferences,
      conversationState,
    };
  }
}
