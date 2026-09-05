// ELA Types Definition
// RuralFlow / AgriRoute Universal Multilingual Logistics Intelligence Assistant

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
  | 'ROLE_DECLARATION'
  | 'SWITCH_LANGUAGE'
  | 'EXPLAIN_PLATFORM'
  | 'GENERAL_HELP'
  | 'LOGOUT'
  // Farmer intents
  | 'OPEN_FARMER_DASHBOARD'
  | 'OPEN_FARMER_PRODUCTS'
  | 'GET_FARMER_PRODUCTS'
  | 'OPEN_ADD_PRODUCT'
  | 'CREATE_PRODUCT_WORKFLOW'
  | 'OPEN_MARKET_DEMAND'
  | 'GET_MARKET_DEMAND'
  | 'OPEN_LOGISTICS_REQUEST'
  | 'CREATE_LOGISTICS_WORKFLOW'
  | 'OPEN_DELIVERIES'
  | 'GET_FARMER_DELIVERIES'
  | 'OPEN_DELIVERY_DETAIL'
  // Buyer intents
  | 'OPEN_BUYER_DASHBOARD'
  | 'OPEN_POST_PROCUREMENT'
  | 'CREATE_PROCUREMENT_WORKFLOW'
  | 'OPEN_BUYER_ORDERS'
  | 'GET_BUYER_ORDERS'
  | 'OPEN_BUYER_ORDER_DETAIL'
  | 'OPEN_PRODUCE_CATALOG'
  | 'GET_BUYER_PRODUCE'
  // Transporter intents
  | 'OPEN_TRANSPORTER_DASHBOARD'
  | 'OPEN_AVAILABLE_TRIPS'
  | 'GET_AVAILABLE_TRIPS'
  | 'ACCEPT_TRIP_WORKFLOW'
  | 'OPEN_TRIP_DETAIL'
  | 'OPEN_ACTIVE_TRIPS'
  | 'GET_ACTIVE_TRIPS'
  | 'OPEN_ACTIVE_TRIP_DETAIL'
  | 'OPEN_VEHICLES'
  | 'GET_VEHICLES'
  | 'CREATE_VEHICLE_WORKFLOW'
  | 'OPEN_EARNINGS'
  | 'GET_EARNINGS'
  | 'OPEN_PERFORMANCE'
  | 'UNKNOWN';

export interface ElaNavigationAction {
  destination: string;
  route: string;
  role?: UserRole;
  label: string;
  description?: string;
  params?: Record<string, string>;
}

export interface ElaConfirmationAction {
  actionId: string;
  toolName: string;
  title: string;
  summary?: string;
  params: Record<string, unknown>;
  confirmLabel?: string;
  cancelLabel?: string;
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
  sessionId?: string;
  isVoice?: boolean;
  audioConfidence?: number;
}

export interface ElaExecutionContext {
  authenticatedUser?: AuthUser | null;
  role: UserRole;
  language: SupportedLanguage;
  currentPage: string;
  confirmed?: boolean;
}

export interface ElaChatRequest {
  message: string;
  history?: ElaMessage[];
  context?: ElaClientContext;
  sessionId?: string;
}

export interface ElaConfirmRequest {
  actionId: string;
  toolName: string;
  params: Record<string, unknown>;
  confirmed: boolean;
  language?: SupportedLanguage;
}

export interface ElaChatResponse {
  message: string;
  intent: ElaIntent;
  language: SupportedLanguage;
  detectedRole: UserRole;
  navigationAction?: ElaNavigationAction | null;
  confirmationAction?: ElaConfirmationAction | null;
  suggestions?: string[];
  actionResult?: {
    toolName: string;
    success: boolean;
    data?: unknown;
    error?: string;
  } | null;
  mlPrediction?: unknown;
  trace?: unknown;
  status?: string;
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
  confirmation?: ElaConfirmationAction;
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
  isConsequential?: boolean;
  execute: (args: Record<string, unknown>, context: ElaExecutionContext) => Promise<ElaToolResult>;
}
