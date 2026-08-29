// Provider Factory for ELA LLM Layer
// RuralFlow AI Provider Management

import { config } from '../../config/env.js';
import type { ILlmProvider } from './llm.interface.js';
import { GeminiLlmProvider } from './gemini.provider.js';
import { FallbackLlmProvider } from './fallback.provider.js';

export class LlmProviderFactory {
  private static instance: ILlmProvider | null = null;

  public static getProvider(): ILlmProvider {
    if (this.instance) {
      return this.instance;
    }

    if (config.geminiApiKey && config.geminiApiKey.trim().length > 0) {
      console.log(`[ELA AI] Initializing Google Gemini Provider (${config.aiModel})...`);
      this.instance = new GeminiLlmProvider(config.geminiApiKey, config.aiModel);
    } else {
      console.log('[ELA AI] No GEMINI_API_KEY detected. Utilizing RuralFlow Native Multilingual Engine.');
      this.instance = new FallbackLlmProvider();
    }

    return this.instance;
  }

  public static setProvider(provider: ILlmProvider): void {
    this.instance = provider;
  }

  public static getFallbackProvider(): ILlmProvider {
    return new FallbackLlmProvider();
  }
}
