// ELA Types Definition
// RuralFlow Multilingual Logistics Intelligence Assistant

import type { Role as PrismaRole } from '@prisma/client';
import type { AuthUser } from '../modules/auth/auth.types.js';

export type UserRole = PrismaRole | 'GUEST';
export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'kn';

export type IntentCategory =
  | 'COMMON'
  | 'FARMER'
  | 'BUYER'
  | 'TRANSPORTER'
  | 'UNKNOWN';

export type ElaIntent =
  // Common / Public intents
  | 'NAVIGATE_HOME'
  | 'LOGIN_GUIDANCE'
  | 'REGISTER_GUIDANCE'
  | 'SWITCH_LANGUAGE'
  | 'GENERAL_HELP'
  | 'LOGOUT'
  // Farmer intents
  | 'OPEN_FARMER_DASHBOARD'
  | 'OPEN_FARMER_PRODUCTS'
  | 'OPEN_ADD_PRODUCT'
  | 'OPEN_MARKET_DEMAND'
  | 'OPEN_LOGISTICS_REQUEST'
  | 'OPEN_DELIVERIES'
  | 'OPEN_DELIVERY_DETAIL'
  // Buyer intents
  | 'OPEN_BUYER_DASHBOARD'
  | 'OPEN_POST_PROCUREMENT'
  | 'OPEN_BUYER_ORDERS'
  | 'OPEN_BUYER_ORDER_DETAIL'
  | 'OPEN_PRODUCE_CATALOG'
  // Transporter intents
  | 'OPEN_TRANSPORTER_DASHBOARD'
  | 'OPEN_AVAILABLE_TRIPS'
  | 'OPEN_TRIP_DETAIL'
  | 'OPEN_ACTIVE_TRIPS'
  | 'OPEN_ACTIVE_TRIP_DETAIL'
  | 'OPEN_VEHICLES'
  | 'OPEN_EARNINGS'
  | 'OPEN_PERFORMANCE'
  // Future domain action intents (Phase 2 stubs)
  | 'CREATE_PROCUREMENT_REQUEST'
  | 'CREATE_LOGISTICS_REQUEST'
  | 'ACCEPT_LOGISTICS_TRIP'
  | 'UPDATE_SHIPMENT_STATUS'
  | 'UNKNOWN';

export interface ElaNavigationAction {
  destination: string;
  route: string;
  role?: UserRole;
  label: string;
  description?: string;
  params?: Record<string, string>;
}

export interface ElaMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  timestamp?: string;
}

export interface ElaClientContext {
  role?: UserRole | string;
  language?: SupportedLanguage | string;
  currentPage?: string;
  userName?: string;
}

export interface ElaExecutionContext {
  authenticatedUser?: AuthUser | null;
  role: UserRole;
  language: SupportedLanguage;
  currentPage: string;
}

export interface ElaChatRequest {
  message: string;
  history?: ElaMessage[];
  context?: ElaClientContext;
}

export interface ElaChatResponse {
  message: string;
  intent: ElaIntent;
  language: SupportedLanguage;
  detectedRole: UserRole;
  navigationAction?: ElaNavigationAction | null;
  suggestions?: string[];
  actionResult?: {
    toolName: string;
    success: boolean;
    data?: unknown;
    error?: string;
  } | null;
  timestamp: string;
}

export interface ElaToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ElaToolResult {
  toolName: string;
  success: boolean;
  data?: unknown;
  error?: string;
  navigation?: ElaNavigationAction;
  userFacingMessage?: string;
}

export interface ElaToolParameterSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  description?: string;
}

export interface ElaToolDefinition {
  name: string;
  description: string;
  parameters: ElaToolParameterSchema;
  allowedRoles: UserRole[];
  execute: (args: Record<string, unknown>, context: ElaExecutionContext) => Promise<ElaToolResult>;
}
