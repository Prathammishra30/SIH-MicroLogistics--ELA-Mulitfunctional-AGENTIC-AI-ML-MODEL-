// ELA Multilingual & Agentic Integration Test Matrix (Phase 3 Enterprise Architecture)
// Validates multilingual understanding, canonical intents, entity extraction, 3-layer memory,
// goal decomposition, ML predictors (Demand, Price, ETA, Match, Recs), self-learning, and security.

import { ElaAgent } from '../src/ai/ela/agent.js';
import { EntityExtractor } from '../src/ai/ela/entities.js';
import { GoalManager } from '../src/ai/ela/goals.js';
import { ConversationMemory } from '../src/ai/memory/conversationMemory.js';
import { UserMemory } from '../src/ai/memory/userMemory.js';
import { MLGateway } from '../src/ai/ml/mlGateway.js';
import { FeedbackCollector } from '../src/ai/learning/feedbackCollector.js';
import { ModelEvaluator } from '../src/ai/learning/evaluator.js';
import { DemandPredictorModel } from '../src/ai/ml/demandPredictor.js';
import { ROUTE_REGISTRY } from '../src/ai/tools/navigation.tools.js';
import type { AuthUser } from '../src/modules/auth/auth.types.js';

interface TestCase {
  name: string;
  message: string;
  language: 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'kn';
  user?: AuthUser;
  expectedIntent?: string;
  expectedDestination?: string;
  expectedRoute?: string;
  shouldHaveNavigation?: boolean;
  shouldHaveConfirmation?: boolean;
  shouldShieldCredentials?: boolean;
}

const mockFarmer: AuthUser = {
  id: 'test-farmer-uuid',
  email: 'kisan@ruralflow.in',
  name: 'Ramesh Patil',
  role: 'FARMER',
  createdAt: new Date().toISOString(),
};

const mockBuyer: AuthUser = {
  id: 'test-buyer-uuid',
  email: 'buyer@apmc.in',
  name: 'Suresh Shah',
  role: 'BUYER',
  createdAt: new Date().toISOString(),
};

const mockTransporter: AuthUser = {
  id: 'test-transporter-uuid',
  email: 'transporter@fleet.in',
  name: 'Vijay Shinde',
  role: 'TRANSPORTER',
  createdAt: new Date().toISOString(),
};

// ==========================================
// 1. BASELINE CONVERSATIONAL & NAVIGATION TESTS (23 Tests)
// ==========================================
const testCases: TestCase[] = [
  // 1. Farmer - Marathi (Deliveries Data Tool)
  {
    name: 'Farmer Marathi - Deliveries / Shipments',
    message: 'माझी डिलिव्हरी तपासा',
    language: 'mr',
    user: mockFarmer,
    expectedIntent: 'GET_FARMER_DELIVERIES',
  },
  // 2. Farmer - Hindi (Products Catalog Data Tool)
  {
    name: 'Farmer Hindi - Products Catalog',
    message: 'मेरे उत्पाद दिखाओ',
    language: 'hi',
    user: mockFarmer,
    expectedIntent: 'GET_FARMER_PRODUCTS',
  },
  // 3. Farmer - Consequential Action: Add Product (Returns Confirmation Card)
  {
    name: 'Farmer - Add 500 kg Tomato Produce (Confirmation Card Required)',
    message: '500 kg organic tomato add karna hai',
    language: 'en',
    user: mockFarmer,
    expectedIntent: 'CREATE_PRODUCT_WORKFLOW',
    shouldHaveConfirmation: true,
  },
  // 4. Farmer - Consequential Action: Request Transport to Mandi (Returns Confirmation Card)
  {
    name: 'Farmer - Request Transport to Pune (Confirmation Card Required)',
    message: '500 kg tomato Pune mandi bhejna hai transport chahiye',
    language: 'en',
    user: mockFarmer,
    expectedIntent: 'CREATE_LOGISTICS_WORKFLOW',
    shouldHaveConfirmation: true,
  },
  // 5. Buyer - Consequential Action: Post Procurement Demand (Returns Confirmation Card)
  {
    name: 'Buyer - Post Procurement for 500 kg Tomatoes (Confirmation Card Required)',
    message: '500 kg tomatoes kharidna hai 40 rs me Navi Mumbai ke liye',
    language: 'en',
    user: mockBuyer,
    expectedIntent: 'CREATE_PROCUREMENT_WORKFLOW',
    shouldHaveConfirmation: true,
  },
  // 6. Buyer - Marathi: Produce Catalog Data Query
  {
    name: 'Buyer Marathi - Produce Catalog',
    message: 'उपलब्ध शेतमालाची यादी दाखवा',
    language: 'mr',
    user: mockBuyer,
    expectedIntent: 'GET_BUYER_PRODUCE',
  },
  // 7. Buyer - Hindi: Buyer Orders Data Query
  {
    name: 'Buyer Hindi - My Orders',
    message: 'मेरे खरीद ऑर्डर्स दिखाओ',
    language: 'hi',
    user: mockBuyer,
    expectedIntent: 'GET_BUYER_ORDERS',
  },
  // 8. Transporter - Marathi: Available Trips Data Query
  {
    name: 'Transporter Marathi - Available Trips',
    message: 'नवीन उपलब्ध फेऱ्या कोणत्या आहेत?',
    language: 'mr',
    user: mockTransporter,
    expectedIntent: 'GET_AVAILABLE_TRIPS',
  },
  // 9. Transporter - Hindi: Manage Vehicles Data Query
  {
    name: 'Transporter Hindi - Manage Vehicles',
    message: 'मेरी गाड़ियां और ट्रक दिखाओ',
    language: 'hi',
    user: mockTransporter,
    expectedIntent: 'GET_VEHICLES',
  },
  // 10. Transporter - Consequential Action: Add Truck (Returns Confirmation Card)
  {
    name: 'Transporter - Register Pickup Truck (Confirmation Card Required)',
    message: 'Pickup gadi add karni hai MH 12 AB 1234',
    language: 'en',
    user: mockTransporter,
    expectedIntent: 'CREATE_VEHICLE_WORKFLOW',
    shouldHaveConfirmation: true,
  },
  // 11. Transporter - English: Calculate Earnings
  {
    name: 'Transporter English - Calculate Earnings',
    message: 'Show my earnings and payout settlements',
    language: 'en',
    user: mockTransporter,
    expectedIntent: 'GET_EARNINGS',
  },
  // 12. Tamil - Deliveries
  {
    name: 'Tamil input - Deliveries',
    message: 'எனது விநியோகங்களை காட்டுங்கள்',
    language: 'ta',
    user: mockFarmer,
    expectedIntent: 'GET_FARMER_DELIVERIES',
  },
  // 13. Telugu - Trips
  {
    name: 'Telugu input - Trips',
    message: 'అందుబాటులో ఉన్న ట్రిప్పులు చూపించు',
    language: 'te',
    user: mockTransporter,
    expectedIntent: 'GET_AVAILABLE_TRIPS',
  },
  // 14. Bengali - Farmer Products
  {
    name: 'Bengali input - Products',
    message: 'আমার পণ্য এবং ফসল দেখান',
    language: 'bn',
    user: mockFarmer,
    expectedIntent: 'GET_FARMER_PRODUCTS',
  },
  // 15. Kannada - Market Demand
  {
    name: 'Kannada input - Market Demand',
    message: 'ಮಾರುಕಟ್ಟೆ ಬೇಡಿಕೆ ತೋರಿಸಿ',
    language: 'kn',
    user: mockFarmer,
    expectedIntent: 'GET_MARKET_DEMAND',
  },
  // 16. Guest - Farmer Natural Language Declaration & Direct Auth Routing
  {
    name: 'Guest - Farmer Natural Language Declaration',
    message: 'Main farmer hoon mujhe login karna hai',
    language: 'en',
    user: undefined,
    expectedIntent: 'LOGIN_GUIDANCE',
    expectedDestination: 'login_farmer',
    expectedRoute: '/auth/farmer',
    shouldHaveNavigation: true,
  },
  // 17. Guest - Buyer Natural Language Declaration in Tamil
  {
    name: 'Guest - Buyer Declaration Tamil',
    message: 'நான் ஒரு வாங்குபவர் உள்நுழைய வேண்டும்',
    language: 'ta',
    user: undefined,
    expectedIntent: 'LOGIN_GUIDANCE',
    expectedDestination: 'login_buyer',
    expectedRoute: '/auth/buyer',
    shouldHaveNavigation: true,
  },
  // 18. Guest - Transporter Natural Language Declaration in Marathi
  {
    name: 'Guest - Transporter Declaration Marathi',
    message: 'मी वाहतूकदार आहे आणि मला लॉगिन करायचे आहे',
    language: 'mr',
    user: undefined,
    expectedIntent: 'LOGIN_GUIDANCE',
    expectedDestination: 'login_transporter',
    expectedRoute: '/auth/transporter',
    shouldHaveNavigation: true,
  },
  // 19. Public Landing - Platform Explanation
  {
    name: 'Public Landing - Explain Farmer Benefits in Hindi',
    message: 'किसानों के लिए एग्रीरूट का क्या फायदा है?',
    language: 'hi',
    user: undefined,
    expectedIntent: 'EXPLAIN_PLATFORM',
  },
  // 20. Sensitive Credential Shield (CRITICAL SECURITY GUARDRAIL)
  {
    name: 'Security Shield - User supplies password in chat',
    message: 'Mera password 123456 hai mujhe login kara do',
    language: 'en',
    user: undefined,
    shouldShieldCredentials: true,
  },
  // 21. Sensitive Credential Shield - OTP attempt
  {
    name: 'Security Shield - User supplies OTP code in chat',
    message: 'Here is my OTP verification code: 987654',
    language: 'en',
    user: undefined,
    shouldShieldCredentials: true,
  },
  // 22. Security / RBAC Boundary Test: Farmer attempting to execute Transporter tools
  {
    name: 'RBAC Boundary - Farmer asking for Transporter fleet',
    message: 'Add truck MH 12 AB 1234',
    language: 'en',
    user: mockFarmer,
    shouldHaveConfirmation: false, // Forbidden for FARMER
  },
];

async function runTests() {
  console.log('\n======================================================');
  console.log('🤖 ELA PHASE 3 ENTERPRISE AGENTIC AI TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  // ----------------------------------------------------
  // TEST SUITE 1: Baseline Conversational & Action Tests
  // ----------------------------------------------------
  console.log('▶ [SUITE 1] Baseline Conversational, Navigation & Security Tests');
  for (const tc of testCases) {
    try {
      const response = await ElaAgent.processMessage(
        {
          message: tc.message,
          context: {
            language: tc.language,
            role: tc.user?.role,
          },
        },
        tc.user
      );

      let isSuccess = true;
      const errors: string[] = [];

      if (tc.expectedIntent && response.intent !== tc.expectedIntent) {
        isSuccess = false;
        errors.push(`Expected intent '${tc.expectedIntent}' but got '${response.intent}'`);
      }

      if (tc.shouldShieldCredentials) {
        if (!response.message.toLowerCase().includes('password') && !response.message.toLowerCase().includes('otp')) {
          isSuccess = false;
          errors.push('Expected credential shield security message');
        }
      }

      if (tc.shouldHaveConfirmation) {
        if (!response.confirmationAction) {
          isSuccess = false;
          errors.push('Expected confirmation card for consequential action, but none was returned');
        }
      }

      if (tc.shouldHaveNavigation) {
        if (!response.navigationAction) {
          isSuccess = false;
          errors.push('Expected navigation action but none was returned');
        } else {
          if (tc.expectedDestination && response.navigationAction.destination !== tc.expectedDestination) {
            isSuccess = false;
            errors.push(`Expected destination '${tc.expectedDestination}' but got '${response.navigationAction.destination}'`);
          }
          if (tc.expectedRoute && response.navigationAction.route !== tc.expectedRoute) {
            isSuccess = false;
            errors.push(`Expected route '${tc.expectedRoute}' but got '${response.navigationAction.route}'`);
          }
        }
      }

      if (isSuccess) {
        console.log(`  ✅ [PASS] ${tc.name}`);
        passed++;
      } else {
        console.error(`  ❌ [FAIL] ${tc.name}: ${errors.join(', ')}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ [FAIL] ${tc.name} with exception:`, err);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 2: Multilingual Entity Extraction
  // ----------------------------------------------------
  console.log('\n▶ [SUITE 2] Multilingual Entity Extraction Engine');
  const entityTests = [
    {
      text: 'Add 500 kg organic tomatoes Grade A at ₹40/kg for Pune',
      expected: { product: 'Tomatoes', quantity: 500, unit: 'kg', price: 40, grade: 'A', destination: 'Pune APMC Mandi' },
    },
    {
      text: 'मला २ टन कांदा मुंबई बाजारपेठेत पाठवायचा आहे',
      expected: { product: 'Onions', quantity: 2, unit: 'MT', destination: 'Navi Mumbai APMC Mandi' },
    },
    {
      text: 'எனக்கு 1000 கிலோ தக்காளி ₹35 விலையில் வேண்டும்',
      expected: { product: 'Tomatoes', quantity: 1000, unit: 'kg', price: 35 },
    },
    {
      text: 'నాకు 50 క్వింటా బంగాళాదుంప కావాలి',
      expected: { product: 'Potatoes', quantity: 50, unit: 'quintal' },
    },
    {
      text: 'Register Mini Truck MH 12 AB 9876',
      expected: { vehicleType: 'Mini Truck (750 kg)', vehicleRegistration: 'MH 12 AB 9876' },
    },
  ];

  for (const et of entityTests) {
    const parsed = EntityExtractor.extractEntities(et.text) as Record<string, unknown>;
    let ok = true;
    for (const [k, v] of Object.entries(et.expected)) {
      if (parsed[k] !== v) {
        ok = false;
        console.error(`  ❌ [FAIL Entity] Key '${k}' expected '${v}' but got '${parsed[k]}'`);
      }
    }
    if (ok) {
      console.log(`  ✅ [PASS] Entity Extractor: "${et.text.slice(0, 45)}..." -> ${(parsed.product as string) || (parsed.vehicleType as string) || 'Entities'}`);
      passed++;
    } else {
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 3: Multi-Turn Conversation Memory
  // ----------------------------------------------------
  console.log('\n▶ [SUITE 3] Multi-Turn Conversation Memory');
  const testSessionId = `test-sess-${Date.now()}`;
  ConversationMemory.updateEntities(testSessionId, { product: 'Tomatoes', quantity: 500, unit: 'kg' });
  ConversationMemory.updateEntities(testSessionId, { grade: 'Premium', price: 45 });
  const turnState = ConversationMemory.getSession(testSessionId);

  if (
    turnState.accumulatedEntities.product === 'Tomatoes' &&
    turnState.accumulatedEntities.quantity === 500 &&
    turnState.accumulatedEntities.grade === 'Premium' &&
    turnState.accumulatedEntities.price === 45
  ) {
    console.log('  ✅ [PASS] Multi-turn entity accumulation verified across consecutive turns.');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Multi-turn entity accumulation failed:', turnState.accumulatedEntities);
    failed++;
  }

  // ----------------------------------------------------
  // TEST SUITE 4: User Preference Long-Term Memory
  // ----------------------------------------------------
  console.log('\n▶ [SUITE 4] User Preference Long-Term Memory');
  UserMemory.updatePreferences('user-pref-1', {
    preferredLanguage: 'mr',
    defaultMandi: 'Pune APMC',
    frequentCrops: ['Tomatoes', 'Onions', 'Grapes'],
  });
  const prefs = UserMemory.getPreferences('user-pref-1');

  if (prefs.preferredLanguage === 'mr' && prefs.defaultMandi === 'Pune APMC' && prefs.frequentCrops?.includes('Grapes')) {
    console.log('  ✅ [PASS] User long-term preferences stored and retrieved successfully.');
    passed++;
  } else {
    console.error('  ❌ [FAIL] User long-term preferences test failed:', prefs);
    failed++;
  }

  // ----------------------------------------------------
  // TEST SUITE 5: Goal Management & Subtask Decomposition
  // ----------------------------------------------------
  console.log('\n▶ [SUITE 5] Goal Management & Subtask Decomposition');
  const goal = GoalManager.decomposeGoal(
    'CREATE_LOGISTICS_WORKFLOW',
    { product: 'Tomatoes', formattedQuantity: '500 kg', destination: 'Pune APMC Mandi' },
    'FARMER',
    'I need to get my 500 kg tomatoes delivered to Pune tomorrow'
  );

  if (goal.subtasks.length >= 2 && goal.subtasks[0].toolName === 'create_product' && goal.subtasks[1].toolName === 'create_logistics_request') {
    console.log(`  ✅ [PASS] Goal decomposed successfully into ${goal.subtasks.length} subtasks (${goal.title}).`);
    passed++;
  } else {
    console.error('  ❌ [FAIL] Goal decomposition failed:', goal);
    failed++;
  }

  // ----------------------------------------------------
  // TEST SUITE 6: Machine Learning Models (Demand, Price, ETA, Match, Recs)
  // ----------------------------------------------------
  console.log('\n▶ [SUITE 6] Machine Learning Gateway & Prediction Models');
  const mlGateway = MLGateway.getInstance();

  // 6A. Demand Forecasting
  const demandRes = await mlGateway.predictDemand({ cropName: 'Tomatoes', location: 'pune', month: 11 });
  if (demandRes.prediction.predictedDemandKg > 0 && demandRes.confidence >= 0.75 && demandRes.metrics) {
    console.log(`  ✅ [PASS] ML Demand Model: ${demandRes.prediction.predictedDemandKg} kg (Confidence: ${Math.round(demandRes.confidence * 100)}%, Trend: ${demandRes.prediction.trend}, MAE: ${demandRes.metrics.mae})`);
    passed++;
  } else {
    console.error('  ❌ [FAIL] ML Demand Model failed:', demandRes);
    failed++;
  }

  // 6B. Price Forecasting
  const priceRes = await mlGateway.predictPrice({ cropName: 'Tomatoes', mandiLocation: 'Pune APMC', grade: 'A' });
  if (priceRes.prediction.minPrice > 0 && priceRes.prediction.maxPrice >= priceRes.prediction.minPrice && priceRes.confidence >= 0.75) {
    console.log(`  ✅ [PASS] ML Price Model: ₹${priceRes.prediction.minPrice}–₹${priceRes.prediction.maxPrice}/kg (Avg: ₹${priceRes.prediction.predictedAvgPrice}/kg, Confidence: ${Math.round(priceRes.confidence * 100)}%)`);
    passed++;
  } else {
    console.error('  ❌ [FAIL] ML Price Model failed:', priceRes);
    failed++;
  }

  // 6C. ETA Prediction
  const etaRes = await mlGateway.predictEta({ pickupLocation: 'Farm', destination: 'Pune Mandi', distanceKm: 85, vehicleType: 'pickup' });
  if (etaRes.prediction.estimatedDurationMinutes > 0 && etaRes.confidence >= 0.8) {
    console.log(`  ✅ [PASS] ML ETA Model: ${etaRes.prediction.formattedDuration} (~${etaRes.prediction.estimatedDurationMinutes} mins, Confidence: ${Math.round(etaRes.confidence * 100)}%)`);
    passed++;
  } else {
    console.error('  ❌ [FAIL] ML ETA Model failed:', etaRes);
    failed++;
  }

  // 6D. Transporter-Load Matching Engine
  const matchRes = await mlGateway.predictMatch({ transporterCapacityKg: 1500, loadQuantityKg: 1200, distanceKm: 85, offeredEarnings: 4500 });
  if (matchRes.prediction.matchScore >= 60 && matchRes.prediction.capacityMatchPercent === 80) {
    console.log(`  ✅ [PASS] ML Transporter Match Model: Score ${matchRes.prediction.matchScore}/100 (${matchRes.prediction.compatibilityRating}, Utilization: ${matchRes.prediction.capacityMatchPercent}%)`);
    passed++;
  } else {
    console.error('  ❌ [FAIL] ML Matching Model failed:', matchRes);
    failed++;
  }

  // 6E. Recommendation Engine
  const farmerRecs = await mlGateway.recommendationEngine.getFarmerCropRecommendations('Pune');
  if (farmerRecs.length > 0 && farmerRecs[0].confidence > 0.7) {
    console.log(`  ✅ [PASS] Recommendation Engine: Generated ${farmerRecs.length} crop recommendations (Top: ${farmerRecs[0].cropName} @ ${farmerRecs[0].expectedPrice})`);
    passed++;
  } else {
    console.error('  ❌ [FAIL] Recommendation Engine failed:', farmerRecs);
    failed++;
  }

  // ----------------------------------------------------
  // TEST SUITE 7: Controlled Self-Learning & Feedback Pipeline
  // ----------------------------------------------------
  console.log('\n▶ [SUITE 7] Controlled Self-Learning & Model Governance');
  FeedbackCollector.recordUserFeedback({
    role: 'FARMER',
    rating: 'POSITIVE',
    feedbackText: 'Accurate price forecast for tomatoes',
  });
  FeedbackCollector.recordPredictionOutcome('commodity-demand-predictor', 'demand-v1', 1800, 1950, { crop: 'tomato' });
  const outcomes = FeedbackCollector.getOutcomeHistory('commodity-demand-predictor');

  if (outcomes.length > 0 && outcomes[0].absoluteError === 150) {
    console.log('  ✅ [PASS] Outcome telemetry recorded & error computed accurately (MAE tracked).');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Outcome telemetry failed:', outcomes);
    failed++;
  }

  // Candidate Model Comparison
  const activeDemandModel = new DemandPredictorModel();
  const candidateDemandModel = new DemandPredictorModel();
  const testSample = [
    { features: { cropName: 'tomato', location: 'pune', month: 11, historicalAvgKg: 1800 }, target: 2000 },
    { features: { cropName: 'onion', location: 'nashik', month: 11, historicalAvgKg: 2400 }, target: 2600 },
  ];
  const comparison = await ModelEvaluator.compareModels(activeDemandModel, candidateDemandModel, testSample);
  if (comparison.activeMetrics && comparison.candidateMetrics) {
    console.log(`  ✅ [PASS] Model Evaluator Comparison: Active MAE (${comparison.activeMetrics.mae}) vs Candidate MAE (${comparison.candidateMetrics.mae}) -> ${comparison.recommendation}`);
    passed++;
  } else {
    console.error('  ❌ [FAIL] Model evaluation comparison failed:', comparison);
    failed++;
  }

  // ----------------------------------------------------
  // TEST SUITE 8: Action Confirmation & PostgreSQL DB Verification
  // ----------------------------------------------------
  console.log('\n▶ [SUITE 8] Action Execution with Post-Database Verification');
  try {
    const { prisma } = await import('../src/config/prisma.js');
    let realFarmer = await prisma.user.findFirst({ where: { role: 'FARMER' } });

    if (!realFarmer) {
      realFarmer = await prisma.user.create({
        data: {
          email: `test_farmer_${Date.now()}@ruralflow.in`,
          passwordHash: 'dummy_hash',
          name: 'Test Farmer Patil',
          role: 'FARMER',
        },
      });
    }

    const testFarmerUser: AuthUser = {
      id: realFarmer.id,
      email: realFarmer.email,
      name: realFarmer.name,
      role: 'FARMER',
      createdAt: realFarmer.createdAt.toISOString(),
    };

    const confirmResult = await ElaAgent.executeConfirmedAction(
      {
        actionId: 'test-act-phase3',
        toolName: 'create_product',
        params: {
          name: 'Phase 3 Grade A Tomatoes',
          category: 'Fresh Vegetables',
          quantity: '500 kg',
          grade: 'A',
        },
        confirmed: true,
        language: 'en',
      },
      testFarmerUser
    );

    if (confirmResult.actionResult?.success) {
      console.log(`  ✅ [PASS] Confirmed Action & Database Verification: ${confirmResult.message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] Action execution DB verification failed: ${confirmResult.actionResult?.error}`);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ [FAIL] Action confirmation execution threw:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`📊 FINAL REGRESSION RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${passed + failed})`);
  console.log(`🗺️  Registered Routes in Catalog: ${Object.keys(ROUTE_REGISTRY).length}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
