// ELA Router & API Endpoints (Phase 4 Enterprise Architecture)
// Routes chat requests, consequential confirmations, session state inspection, task tracking, self-learning feedback, and ML models

import { Router } from 'express';
import {
  handleChatMessage,
  handleConfirmAction,
  handleFeedback,
  handleGetMLModels,
  handleGetRecommendations,
  handleGetSessionState,
  handleGetTasks,
  handleHealthCheck,
  handleInternalToolExecution,
} from '../controllers/ela.controller.js';
import { ROUTE_REGISTRY } from './tools/navigation.tools.js';
import { sendSuccess } from '../utils/response.js';

export const elaRoutes = Router();

// Primary conversation endpoints
elaRoutes.post('/chat', handleChatMessage);
elaRoutes.post('/message', handleChatMessage);

// Internal Node tool bridge for Python ELA
elaRoutes.post('/internal/tool', handleInternalToolExecution);

// Consequential action confirmation endpoints
elaRoutes.post('/confirm', handleConfirmAction);
elaRoutes.post('/action/confirm', handleConfirmAction);

// Session state & task inspection endpoints
elaRoutes.get('/session/:id', handleGetSessionState);
elaRoutes.get('/tasks/:id', handleGetTasks);

// Controlled self-learning telemetry feedback endpoint
elaRoutes.post('/feedback', handleFeedback);

// Machine Learning observability endpoints
elaRoutes.get('/ml/models', handleGetMLModels);
elaRoutes.get('/ml/recommendations', handleGetRecommendations);

// Status & catalog endpoints
elaRoutes.get('/health', handleHealthCheck);
elaRoutes.get('/intents', (_req, res) => {
  sendSuccess(res, 'ELA navigation catalog retrieved.', {
    destinations: ROUTE_REGISTRY,
  });
});
