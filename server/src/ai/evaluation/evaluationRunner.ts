// ELA Phase 4 Enterprise Intelligence Core Benchmark Runner
// Runs 55+ benchmark scenarios across 10 evaluation categories and generates structured scorecards

import { ElaAgent } from '../ela/agent.js';
import { EntityExtractor } from '../ela/entities.js';
import { EVALUATION_SCENARIOS } from './scenarios.js';
import { DemandPredictorModel } from '../ml/demandPredictor.js';
import { ModelEvaluator } from '../learning/evaluator.js';
import { ConversationMemory } from '../memory/conversationMemory.js';

interface BenchmarkScorecard {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  categoryResults: Record<string, { total: number; passed: number; failed: number }>;
  executionDurationMs: number;
}

export async function runEvaluation(): Promise<BenchmarkScorecard> {
  console.log('\n======================================================');
  console.log('🏆 ELA PHASE 4 ENTERPRISE INTELLIGENCE CORE BENCHMARK');
  console.log('======================================================\n');

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  const categoryResults: Record<string, { total: number; passed: number; failed: number }> = {};

  const failuresList: string[] = [];

  for (const sc of EVALUATION_SCENARIOS) {
    if (!categoryResults[sc.category]) {
      categoryResults[sc.category] = { total: 0, passed: 0, failed: 0 };
    }
    categoryResults[sc.category].total++;

    try {
      // 1. If scenario is pure entity extraction, test EntityExtractor directly
      if (sc.category === 'ENTITY_EXTRACTION') {
        const entities = EntityExtractor.extractEntities(sc.input);
        let ok = true;
        const errs: string[] = [];

        if (sc.expectedProduct && entities.product !== sc.expectedProduct) {
          ok = false;
          errs.push(`Expected product '${sc.expectedProduct}' but got '${entities.product}'`);
        }
        if (sc.expectedQuantity && entities.quantity !== sc.expectedQuantity) {
          ok = false;
          errs.push(`Expected quantity '${sc.expectedQuantity}' but got '${entities.quantity}'`);
        }
        if (sc.expectedDestination && entities.destination !== sc.expectedDestination) {
          ok = false;
          errs.push(`Expected destination '${sc.expectedDestination}' but got '${entities.destination}'`);
        }
        if (sc.expectedVehicleType && entities.vehicleType !== sc.expectedVehicleType) {
          ok = false;
          errs.push(`Expected vehicleType '${sc.expectedVehicleType}' but got '${entities.vehicleType}'`);
        }

        if (ok) {
          passed++;
          categoryResults[sc.category].passed++;
        } else {
          failed++;
          categoryResults[sc.category].failed++;
          failuresList.push(`[${sc.id}] ${sc.description}: ${errs.join(', ')}`);
        }
        continue;
      }

      // 2. Full Agent Execution
      const res = await ElaAgent.processMessage(
        {
          message: sc.input,
          context: {
            language: sc.language,
            role: sc.user?.role || 'GUEST',
          },
        },
        sc.user
      );

      let isSuccess = true;
      const errors: string[] = [];

      if (sc.expectedIntent && res.intent !== sc.expectedIntent) {
        isSuccess = false;
        errors.push(`Expected intent '${sc.expectedIntent}' but got '${res.intent}'`);
      }

      if (sc.expectedRole && res.detectedRole !== sc.expectedRole) {
        isSuccess = false;
        errors.push(`Expected role '${sc.expectedRole}' but got '${res.detectedRole}'`);
      }

      if (sc.shouldShieldCredentials) {
        if (!res.message.toLowerCase().includes('password') && !res.message.toLowerCase().includes('otp') && !res.message.toLowerCase().includes('pin')) {
          isSuccess = false;
          errors.push('Expected sensitive credential shield message');
        }
      }

      if (sc.shouldNeedClarification) {
        if (
          !res.message.includes('?') &&
          !res.message.toLowerCase().includes('where') &&
          !res.message.toLowerCase().includes('what') &&
          !res.message.toLowerCase().includes('which') &&
          !res.message.toLowerCase().includes('please') &&
          !res.message.toLowerCase().includes('कहाँ') &&
          !res.message.toLowerCase().includes('कुठे') &&
          !res.message.toLowerCase().includes('कोण')
        ) {
          isSuccess = false;
          errors.push(`Expected clarification question in response but got: "${res.message}"`);
        }
      }

      if (sc.shouldRequireConfirmation) {
        if (!res.confirmationAction) {
          isSuccess = false;
          errors.push('Expected confirmationAction card');
        }
      }

      if (sc.shouldHaveNavigation) {
        if (!res.navigationAction) {
          isSuccess = false;
          errors.push('Expected navigationAction');
        }
      }

      if (isSuccess) {
        passed++;
        categoryResults[sc.category].passed++;
      } else {
        failed++;
        categoryResults[sc.category].failed++;
        failuresList.push(`[${sc.id}] ${sc.description}: ${errors.join(', ')}`);
      }
    } catch (err) {
      failed++;
      categoryResults[sc.category].failed++;
      failuresList.push(`[${sc.id}] ${sc.description} with exception: ${String(err)}`);
    }
  }

  // 3. Additional Core Intelligence System Validations
  console.log('▶ [SYSTEM] ML Governance, Evaluator, & Memory Integrity Checks');

  // Candidate evaluation gate check
  const activeM = new DemandPredictorModel();
  const candM = new DemandPredictorModel();
  const sample = [
    { features: { cropName: 'tomato', location: 'pune', month: 11, historicalAvgKg: 1800 }, target: 2000 },
  ];
  const evalResult = await ModelEvaluator.compareModels(activeM, candM, sample);
  if (evalResult.recommendation) {
    console.log(`  ✅ [PASS] Governed Model Evaluator: ${evalResult.recommendation}`);
  }

  // Multi-turn Memory Accumulation Check
  const sid = `bench-mem-${Date.now()}`;
  ConversationMemory.updateEntities(sid, { product: 'Tomatoes', quantity: 500 });
  ConversationMemory.updateEntities(sid, { destination: 'Pune APMC Mandi' });
  const memState = ConversationMemory.getSession(sid);
  if (memState.accumulatedEntities.product === 'Tomatoes' && memState.accumulatedEntities.destination === 'Pune APMC Mandi') {
    console.log('  ✅ [PASS] Session Multi-Turn Entity Accumulation Verified.');
  }

  const durationMs = Date.now() - startTime;
  console.log('\n======================================================');
  console.log('📊 BENCHMARK SCORECARD SUMMARY BY CATEGORY:');
  console.log('======================================================');
  for (const [cat, res] of Object.entries(categoryResults)) {
    const rate = Math.round((res.passed / res.total) * 100);
    console.log(`  • ${cat.padEnd(28)}: ${res.passed}/${res.total} (${rate}%)`);
  }
  console.log('------------------------------------------------------');
  console.log(`🎯 OVERALL SCORE: ${passed}/${EVALUATION_SCENARIOS.length} (${Math.round((passed / EVALUATION_SCENARIOS.length) * 100)}% Pass Rate)`);
  console.log(`⏱️  Duration: ${durationMs}ms`);

  if (failuresList.length > 0) {
    console.log('\n❌ FAILED SCENARIOS DETAILS:');
    failuresList.forEach((f) => console.log(`  • ${f}`));
  }
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }

  return {
    totalScenarios: EVALUATION_SCENARIOS.length,
    passedScenarios: passed,
    failedScenarios: failed,
    categoryResults,
    executionDurationMs: durationMs,
  };
}

runEvaluation();
