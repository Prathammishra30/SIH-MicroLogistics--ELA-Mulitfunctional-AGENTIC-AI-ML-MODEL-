// Google Gemini LLM Provider Implementation
// RuralFlow ELA AI Engine

import type { ILlmProvider, LlmCompletionOptions, LlmCompletionResult } from './llm.interface.js';
import type { ElaIntent, ElaToolCall } from '../ela.types.js';

export class GeminiLlmProvider implements ILlmProvider {
  public readonly name = 'Google Gemini Provider';
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generateCompletion(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key is not configured or invalid.');
    }

    const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    // Convert messages to Gemini format
    const contents = options.messages.map((m) => {
      const role = m.role === 'assistant' ? 'model' : 'user';
      return {
        role,
        parts: [{ text: m.content }],
      };
    });

    // Format tools if provided
    let functionDeclarations: unknown[] | undefined;
    if (options.tools && options.tools.length > 0) {
      functionDeclarations = options.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }));
    }

    const payload: Record<string, unknown> = {
      systemInstruction: {
        parts: [{ text: options.systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 800,
      },
    };

    if (functionDeclarations && functionDeclarations.length > 0) {
      payload.tools = [{ functionDeclarations }];
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error [${response.status}]: ${errorBody}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            functionCall?: {
              name: string;
              args: Record<string, unknown>;
            };
          }>;
        };
      }>;
    };

    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      return {
        text: "I couldn't process your request. Please try again.",
        intent: 'UNKNOWN',
      };
    }

    let replyText = '';
    const toolCalls: ElaToolCall[] = [];

    for (const part of candidate.content.parts) {
      if (part.text) {
        replyText += part.text;
      }
      if (part.functionCall) {
        toolCalls.push({
          name: part.functionCall.name,
          arguments: part.functionCall.args || {},
        });
      }
    }

    // Determine high-level intent from toolCalls or text
    const intent = this.inferIntent(toolCalls, replyText);

    return {
      text: replyText.trim(),
      intent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      rawResponse: data,
    };
  }

  private inferIntent(toolCalls: ElaToolCall[], _text: string): ElaIntent {
    if (toolCalls.length > 0) {
      const firstCall = toolCalls[0];
      if (firstCall.name === 'navigate_to_page') {
        const dest = String(firstCall.arguments?.destination || '');
        if (dest === 'home') return 'NAVIGATE_HOME';
        if (dest.includes('login') || dest.includes('farmer_auth')) return 'LOGIN_GUIDANCE';
        if (dest === 'farmer_products') return 'OPEN_FARMER_PRODUCTS';
        if (dest === 'farmer_add_product') return 'OPEN_ADD_PRODUCT';
        if (dest === 'farmer_markets') return 'OPEN_MARKET_DEMAND';
        if (dest === 'farmer_logistics') return 'OPEN_LOGISTICS_REQUEST';
        if (dest === 'farmer_deliveries') return 'OPEN_DELIVERIES';
        if (dest === 'buyer_dashboard') return 'OPEN_BUYER_DASHBOARD';
        if (dest === 'buyer_procurement') return 'OPEN_POST_PROCUREMENT';
        if (dest === 'buyer_orders') return 'OPEN_BUYER_ORDERS';
        if (dest === 'buyer_produce') return 'OPEN_PRODUCE_CATALOG';
        if (dest === 'transporter_dashboard') return 'OPEN_TRANSPORTER_DASHBOARD';
        if (dest === 'transporter_trips') return 'OPEN_AVAILABLE_TRIPS';
        if (dest === 'transporter_active_trips') return 'OPEN_ACTIVE_TRIPS';
        if (dest === 'transporter_vehicles') return 'OPEN_VEHICLES';
        if (dest === 'transporter_earnings') return 'OPEN_EARNINGS';
        if (dest === 'transporter_performance') return 'OPEN_PERFORMANCE';
      }
    }
    return 'GENERAL_HELP';
  }
}
