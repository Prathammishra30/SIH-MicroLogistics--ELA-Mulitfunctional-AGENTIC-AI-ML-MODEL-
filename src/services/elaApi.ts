// ELA Frontend API Client Service
// RuralFlow Multilingual Logistics Intelligence Assistant

import { tokenStorage } from './api';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export interface ElaNavigationAction {
  destination: string;
  route: string;
  role?: string;
  label: string;
  description?: string;
  params?: Record<string, string>;
}

export interface ElaMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  navigationAction?: ElaNavigationAction | null;
  suggestions?: string[];
  isError?: boolean;
}

export interface ElaClientContext {
  role?: string;
  language?: string;
  currentPage?: string;
  userName?: string;
}

export interface ElaChatResponseData {
  message: string;
  intent: string;
  language: string;
  detectedRole: string;
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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export async function sendElaChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: ElaClientContext
): Promise<ElaChatResponseData> {
  const token = tokenStorage.get();
  const url = `${API_BASE_URL.replace(/\/+$/, '')}/ela/chat`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      history,
      context,
    }),
  });

  const resData: ApiResponse<ElaChatResponseData> = await response.json().catch(() => ({
    success: false,
    message: `Server returned error ${response.status}`,
  }));

  if (!response.ok || !resData.success || !resData.data) {
    throw new Error(resData.message || resData.error || 'Failed to get response from ELA.');
  }

  return resData.data;
}

export async function getElaHealth(): Promise<{ isAvailable: boolean; providerName: string }> {
  try {
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/ela/health`;
    const res = await fetch(url);
    const data = await res.json();
    return data.data || { isAvailable: false, providerName: 'Unknown' };
  } catch {
    return { isAvailable: false, providerName: 'Offline' };
  }
}
