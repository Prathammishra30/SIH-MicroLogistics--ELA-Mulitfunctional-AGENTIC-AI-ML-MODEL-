// ELA Multilingual & Agentic Integration Test Matrix
// Validates multilingual understanding, role-aware routing, navigation tools, and security boundaries.

import { ElaAgent } from '../src/ai/ela.agent.js';
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

const testCases: TestCase[] = [
  // 1. Farmer - Marathi
  {
    name: 'Farmer Marathi - Deliveries / Shipments',
    message: 'माझी डिलिव्हरी तपासा',
    language: 'mr',
    user: mockFarmer,
    expectedIntent: 'OPEN_DELIVERIES',
    expectedDestination: 'farmer_deliveries',
    expectedRoute: '/farmer/deliveries',
    shouldHaveNavigation: true,
  },
  // 2. Farmer - Hindi
  {
    name: 'Farmer Hindi - Products Catalog',
    message: 'मेरे उत्पाद दिखाओ',
    language: 'hi',
    user: mockFarmer,
    expectedIntent: 'OPEN_FARMER_PRODUCTS',
    expectedDestination: 'farmer_products',
    expectedRoute: '/farmer/products',
    shouldHaveNavigation: true,
  },
  // 3. Farmer - English / Hinglish
  {
    name: 'Farmer Hinglish - Logistics Request',
    message: 'Gaadi chahiye mandi tak produce bhejne ke liye',
    language: 'en',
    user: mockFarmer,
    expectedIntent: 'OPEN_LOGISTICS_REQUEST',
    expectedDestination: 'farmer_logistics',
    expectedRoute: '/farmer/logistics',
    shouldHaveNavigation: true,
  },
  // 4. Buyer - English
  {
    name: 'Buyer English - Post Procurement',
    message: 'I want to post procurement demand for tomatoes',
    language: 'en',
    user: mockBuyer,
    expectedIntent: 'OPEN_POST_PROCUREMENT',
    expectedDestination: 'buyer_procurement',
    expectedRoute: '/buyer/procurement',
    shouldHaveNavigation: true,
  },
  // 5. Buyer - Marathi
  {
    name: 'Buyer Marathi - Produce Catalog',
    message: 'उपलब्ध शेतमालाची यादी दाखवा',
    language: 'mr',
    user: mockBuyer,
    expectedIntent: 'OPEN_PRODUCE_CATALOG',
    expectedDestination: 'buyer_produce',
    expectedRoute: '/buyer/produce',
    shouldHaveNavigation: true,
  },
  // 6. Transporter - Marathi
  {
    name: 'Transporter Marathi - Available Trips',
    message: 'नवीन उपलब्ध फेऱ्या कोणत्या आहेत?',
    language: 'mr',
    user: mockTransporter,
    expectedIntent: 'OPEN_AVAILABLE_TRIPS',
    expectedDestination: 'transporter_trips',
    expectedRoute: '/transporter/trips',
    shouldHaveNavigation: true,
  },
  // 7. Transporter - Hindi
  {
    name: 'Transporter Hindi - Manage Vehicles',
    message: 'मेरी गाड़ियां और ट्रक प्रबंधित करें',
    language: 'hi',
    user: mockTransporter,
    expectedIntent: 'OPEN_VEHICLES',
    expectedDestination: 'transporter_vehicles',
    expectedRoute: '/transporter/vehicles',
    shouldHaveNavigation: true,
  },
  // 8. Transporter - English
  {
    name: 'Transporter English - Earnings',
    message: 'Show my earnings and payouts',
    language: 'en',
    user: mockTransporter,
    expectedIntent: 'OPEN_EARNINGS',
    expectedDestination: 'transporter_earnings',
    expectedRoute: '/transporter/earnings',
    shouldHaveNavigation: true,
  },
  // 9. Tamil - Deliveries
  {
    name: 'Tamil input - Deliveries',
    message: 'எனது விநியோகங்களை காட்டுங்கள்',
    language: 'ta',
    user: mockFarmer,
    expectedIntent: 'OPEN_DELIVERIES',
    expectedDestination: 'farmer_deliveries',
    expectedRoute: '/farmer/deliveries',
    shouldHaveNavigation: true,
  },
  // 10. Telugu - Trips
  {
    name: 'Telugu input - Trips',
    message: 'అందుబాటులో ఉన్న ట్రిప్పులు చూపించు',
    language: 'te',
    user: mockTransporter,
    expectedIntent: 'OPEN_AVAILABLE_TRIPS',
    expectedDestination: 'transporter_trips',
    expectedRoute: '/transporter/trips',
    shouldHaveNavigation: true,
  },
  // 11. Guest - Login Guidance
  {
    name: 'Guest - Farmer Login',
    message: 'I am a farmer and I want to sign in',
    language: 'en',
    user: undefined,
    expectedIntent: 'LOGIN_GUIDANCE',
    expectedDestination: 'login_farmer',
    expectedRoute: '/auth/farmer',
    shouldHaveNavigation: true,
  },
  // 12. Security / RBAC Boundary Test: Farmer attempting to open Transporter vehicles
  {
    name: 'RBAC Boundary - Farmer asking for Transporter Vehicles',
    message: 'Open my transporter vehicles',
    language: 'en',
    user: mockFarmer,
    shouldHaveNavigation: false, // Forbidden for FARMER
  },
];

async function runTests() {
  console.log('\n======================================================');
  console.log('🤖 ELA MULTILINGUAL & AGENTIC VERIFICATION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

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

      if (tc.shouldHaveNavigation) {
        if (!response.navigationAction) {
          isSuccess = false;
          errors.push('Expected navigation action but none was returned');
        } else {
          if (
            tc.expectedDestination &&
            response.navigationAction.destination !== tc.expectedDestination
          ) {
            isSuccess = false;
            errors.push(
              `Expected destination '${tc.expectedDestination}' but got '${response.navigationAction.destination}'`
            );
          }
          if (tc.expectedRoute && response.navigationAction.route !== tc.expectedRoute) {
            isSuccess = false;
            errors.push(
              `Expected route '${tc.expectedRoute}' but got '${response.navigationAction.route}'`
            );
          }
        }
      } else if (tc.shouldHaveNavigation === false) {
        if (response.navigationAction) {
          isSuccess = false;
          errors.push(
            `Expected NO navigation action (RBAC boundary) but got: ${response.navigationAction.route}`
          );
        }
      }

      if (isSuccess) {
        console.log(`✅ [PASS] ${tc.name}`);
        console.log(`   Prompt: "${tc.message}"`);
        console.log(`   Response: "${response.message.slice(0, 75)}..."`);
        if (response.navigationAction) {
          console.log(`   Route: ${response.navigationAction.route} (${response.navigationAction.label})`);
        }
        passed++;
      } else {
        console.error(`❌ [FAIL] ${tc.name}`);
        console.error(`   Errors: ${errors.join(', ')}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ [FAIL] ${tc.name} with exception:`, err);
      failed++;
    }
  }

  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${testCases.length})`);
  console.log(`🗺️  Registered Routes in Catalog: ${Object.keys(ROUTE_REGISTRY).length}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
