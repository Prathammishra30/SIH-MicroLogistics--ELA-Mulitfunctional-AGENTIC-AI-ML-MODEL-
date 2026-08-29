// LLM Provider Interface
// RuralFlow ELA Provider Abstraction

import type {
  ElaMessage,
  ElaToolDefinition,
  ElaExecutionContext,
  ElaIntent,
  ElaToolCall,
} from '../ela.types.js';

export interface LlmCompletionOptions {
  systemPrompt: string;
  messages: ElaMessage[];
  tools?: ElaToolDefinition[];
  context: ElaExecutionContext;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmCompletionResult {
  text: string;
  intent: ElaIntent;
  toolCalls?: ElaToolCall[];
  detectedLanguage?: string;
  detectedRole?: string;
  suggestions?: string[];
  rawResponse?: unknown;
}

export interface ILlmProvider {
  name: string;
  isAvailable(): boolean;
  generateCompletion(options: LlmCompletionOptions): Promise<LlmCompletionResult>;
}
