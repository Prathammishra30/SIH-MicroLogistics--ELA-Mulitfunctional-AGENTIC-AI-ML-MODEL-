import { prisma } from '../src/config/prisma.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

const BASE_URL = 'http://localhost:5000/api';

interface TestResult {
  name: string;
  passed: boolean;
  status?: number;
  message?: string;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    results.push({ name, passed: true, message: detail });
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    results.push({ name, passed: false, error: detail });
    console.error(`  ❌ [FAIL] ${name} - ${detail}`);
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runJwtMatrix() {
  console.log('\n========================================');
  console.log('🔒 RUNNING PHASE 31: JWT TEST MATRIX');
  console.log('========================================');

  // 1. No token
  const res1 = await request('/farmer/products');
  assert(res1.status === 401 && res1.data.message === 'Authentication required. Please log in.', '1. No token → 401', `Status: ${res1.status}, Msg: ${res1.data.message}`);

  // 2. Empty Bearer
  const res2 = await request('/farmer/products', { headers: { Authorization: 'Bearer ' } });
  assert(res2.status === 401 && res2.data.message === 'Authentication required. Please log in.', '2. Empty Bearer → 401', `Status: ${res2.status}`);

  // 3. Malformed token
  const res3 = await request('/farmer/products', { headers: { Authorization: 'Bearer not.a.real.jwt' } });
  assert(res3.status === 401 && res3.data.message === 'Invalid authentication token. Please log in again.', '3. Malformed token → 401 (clean msg)', `Status: ${res3.status}, Msg: ${res3.data.message}`);

  // 4. Random token
  const res4 = await request('/farmer/products', { headers: { Authorization: 'Bearer asdfghjk123456' } });
  assert(res4.status === 401 && res4.data.message === 'Invalid authentication token. Please log in again.', '4. Random token → 401 (clean msg)', `Status: ${res4.status}, Msg: ${res4.data.message}`);

  // 5. Invalid signature
  const fakeSecretToken = jwt.sign({ userId: 'u-1', role: 'FARMER', sessionId: 's-1' }, 'wrong-secret-key-12345');
  const res5 = await request('/farmer/products', { headers: { Authorization: `Bearer ${fakeSecretToken}` } });
  assert(res5.status === 401 && res5.data.message === 'Invalid authentication token. Please log in again.', '5. Invalid signature → 401 (clean msg)', `Status: ${res5.status}, Msg: ${res5.data.message}`);

  // 6. Expired JWT
  const expiredToken = jwt.sign({ userId: 'u-1', role: 'FARMER', sessionId: 's-1' }, config.jwtSecret, { expiresIn: '-10s' });
  const res6 = await request('/farmer/products', { headers: { Authorization: `Bearer ${expiredToken}` } });
  assert(res6.status === 401 && res6.data.message === 'Your session has expired. Please log in again.', '6. Expired JWT → 401 (clean msg)', `Status: ${res6.status}, Msg: ${res6.data.message}`);

  // 7. Missing sessionId
  const missingSessionToken = jwt.sign({ userId: 'u-1', role: 'FARMER' }, config.jwtSecret);
  const res7 = await request('/farmer/products', { headers: { Authorization: `Bearer ${missingSessionToken}` } });
  assert(res7.status === 401 && res7.data.message === 'Invalid token: missing session identifier.', '7. Missing sessionId → 401', `Status: ${res7.status}, Msg: ${res7.data.message}`);

  // 8. Nonexistent session
  const nonExistentSessionToken = jwt.sign({ userId: '00000000-0000-0000-0000-000000000000', role: 'FARMER', sessionId: '00000000-0000-0000-0000-000000000000' }, config.jwtSecret);
  const res8 = await request('/farmer/products', { headers: { Authorization: `Bearer ${nonExistentSessionToken}` } });
  assert(res8.status === 401 && res8.data.message === 'Session not found. Please log in again.', '8. Nonexistent session → 401', `Status: ${res8.status}`);
}

async function runE2EWorkflow() {
  console.log('\n========================================');
  console.log('🌾 RUNNING PHASE 30: E2E MULTI-USER WORKFLOW');
  console.log('========================================');

  const ts = Date.now();
  const farmerAEmail = `farmer_a_${ts}@test.com`;
  const farmerBEmail = `farmer_b_${ts}@test.com`;
  const transporterEmail = `transporter_${ts}@test.com`;
  const buyerEmail = `buyer_${ts}@test.com`;

  const phoneA = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const phoneB = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const phoneT = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const phoneBuyer = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

  // === STEP 1: Farmer A Registration ===
  console.log('\n--- Step 1: Register Farmer A ---');
  const regFarmerA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Farmer Alice',
      email: farmerAEmail,
      password: 'Password123!',
      role: 'FARMER',
      phone: phoneA,
      village: 'Village Alpha',
      district: 'District One',
      state: 'State One',
    }),
  });
  assert(regFarmerA.status === 201 && !!regFarmerA.data.data?.token, 'Farmer A registered', `User ID: ${regFarmerA.data.data?.user?.id}`);
  const tokenA = regFarmerA.data.data?.token;

  // === STEP 2: Farmer A creates Product A ===
  console.log('\n--- Step 2: Farmer A creates Product A ---');
  const prodA = await request('/farmer/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Organic Wheat',
      category: 'Grains',
      quantity: '1000 kg',
      grade: 'Grade A',
      harvestDate: '2026-08-20',
      status: 'Available',
    }),
  });
  assert(prodA.status === 201 && !!prodA.data.data?.product?.id, 'Product A created by Farmer A in PostgreSQL', `Product ID: ${prodA.data.data?.product?.id}`);
  const productAId = prodA.data.data?.product?.id;

  // === STEP 3: Farmer A creates Logistics Request A ===
  console.log('\n--- Step 3: Farmer A creates Logistics A ---');
  const logA = await request('/farmer/logistics', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      productId: productAId,
      productName: 'Organic Wheat',
      quantity: '1000 kg',
      pickupLocation: 'Village Alpha Gate 1',
      destination: 'Central Mandi Hub',
      estimatedEarnings: '₹2,500',
    }),
  });
  assert(logA.status === 201 && !!logA.data.data?.logisticsRequest?.id, 'Logistics A created in PostgreSQL', `Req ID: ${logA.data.data?.logisticsRequest?.id}`);

  // === STEP 4: Farmer A Logout and Critical Old-Token Test (Phase 32) ===
  console.log('\n--- Step 4: Farmer A Logout & Old Token Invalidation (Phase 32) ---');
  const logoutA = await request('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(logoutA.status === 200, 'Farmer A logged out successfully');

  // Verify old token is now REJECTED (401)
  const reuseCheck = await request('/auth/me', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(reuseCheck.status === 401 && reuseCheck.data.message === 'Your session is no longer active. Please log in again.', 'Old token rejected with 401 after server-side logout (Revoked session)', `Status: ${reuseCheck.status}, Msg: ${reuseCheck.data.message}`);

  // === STEP 5: Farmer A Relogin & Data Persistence (Phase 33 & 27) ===
  console.log('\n--- Step 5: Farmer A Re-login & Data Persistence Check ---');
  const reloginA = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: farmerAEmail, password: 'Password123!' }),
  });
  assert(reloginA.status === 200 && !!reloginA.data.data?.token, 'Farmer A re-login succeeds with new session');
  const newTokenA = reloginA.data.data?.token;

  const farmerAProducts = await request('/farmer/products', {
    headers: { Authorization: `Bearer ${newTokenA}` },
  });
  assert(farmerAProducts.data.data?.products?.length === 1 && farmerAProducts.data.data.products[0].id === productAId, 'Product A persists in PostgreSQL across session lifecycle');

  // === STEP 6: Register Farmer B & Verify Data Isolation (Phase 11, 28) ===
  console.log('\n--- Step 6: Register Farmer B & Test Data Isolation ---');
  const regFarmerB = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Farmer Bob',
      email: farmerBEmail,
      password: 'Password123!',
      role: 'FARMER',
      phone: phoneB,
      village: 'Village Beta',
      district: 'District Two',
      state: 'State Two',
    }),
  });
  const tokenB = regFarmerB.data.data?.token;

  // Farmer B should have 0 products initially
  const farmerBInitialProducts = await request('/farmer/products', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(farmerBInitialProducts.data.data?.products?.length === 0, 'Farmer B starts with zero private products (No leakage of Farmer A)');

  // Farmer B creates Product B & Logistics B
  const prodB = await request('/farmer/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      name: 'Fresh Tomatoes',
      category: 'Vegetables',
      quantity: '600 kg',
      grade: 'Grade A',
      harvestDate: '2026-08-22',
      status: 'Available',
    }),
  });
  const productBId = prodB.data.data?.product?.id;

  const logB = await request('/farmer/logistics', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      productId: productBId,
      productName: 'Fresh Tomatoes',
      quantity: '600 kg',
      pickupLocation: 'Village Beta Farm Gate',
      destination: 'Pune APMC Yard',
      estimatedEarnings: '₹1,900',
    }),
  });
  const logisticsBId = logB.data.data?.logisticsRequest?.id;
  assert(!!logisticsBId, 'Logistics B created by Farmer B in PostgreSQL');

  // === STEP 7: Register Transporter & Vehicle Workflow (Phase 13, 17, 18, 19) ===
  console.log('\n--- Step 7: Register Transporter & Vehicle Workflow ---');
  const regTransporter = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Transporter Tom',
      email: transporterEmail,
      password: 'Password123!',
      role: 'TRANSPORTER',
      phone: phoneT,
    }),
  });
  const tokenT = regTransporter.data.data?.token;

  // Check 0 vehicles initially
  const initialVehicles = await request('/transporter/vehicles', {
    headers: { Authorization: `Bearer ${tokenT}` },
  });
  assert(initialVehicles.data.data?.vehicles?.length === 0, 'New transporter starts with zero vehicles');

  // Add Vehicle 1 (Small vehicle: 500 kg capacity)
  const plate1 = `MH12XX${Math.floor(1000 + Math.random() * 9000)}`;
  const addVeh1 = await request('/transporter/vehicles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenT}` },
    body: JSON.stringify({
      type: 'Mini Truck',
      registration: plate1,
      capacity: '500 kg',
    }),
  });
  assert(addVeh1.status === 201 && addVeh1.data.data?.vehicle?.capacityKg === 500, 'Vehicle 1 registered with capacityKg = 500', `ID: ${addVeh1.data.data?.vehicle?.id}`);
  const vehicle1Id = addVeh1.data.data?.vehicle?.id;

  // Add Vehicle 2 (Large vehicle: 1.5 MT capacity)
  const plate2 = `MH14YY${Math.floor(1000 + Math.random() * 9000)}`;
  const addVeh2 = await request('/transporter/vehicles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenT}` },
    body: JSON.stringify({
      type: 'Bolero Pickup',
      registration: plate2,
      capacity: '1.5 MT',
    }),
  });
  assert(addVeh2.status === 201 && addVeh2.data.data?.vehicle?.capacityKg === 1500, 'Vehicle 2 registered with capacityKg = 1500', `ID: ${addVeh2.data.data?.vehicle?.id}`);
  const vehicle2Id = addVeh2.data.data?.vehicle?.id;

  // Test Vehicle Registration Uniqueness
  const duplicatePlateTest = await request('/transporter/vehicles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenT}` },
    body: JSON.stringify({
      type: 'Duplicate Truck',
      registration: plate1,
      capacity: '1000 kg',
    }),
  });
  assert(duplicatePlateTest.status === 409, 'Duplicate vehicle registration plate rejected with 409 Conflict');

  // === STEP 8: Transporter Nearby Logistics Query (Phase 16) ===
  console.log('\n--- Step 8: Transporter Discovers Farmer B Logistics (Phase 16) ---');
  const availableTripsRes = await request('/transporter/logistics/available', {
    headers: { Authorization: `Bearer ${tokenT}` },
  });
  const trips = (availableTripsRes.data.data?.trips || []) as Array<{ id: string; farmer?: { village?: string } }>;
  const foundLogisticsB = trips.find((t) => t.id === logisticsBId);
  assert(!!foundLogisticsB, 'Farmer B Logistics Request is dynamically discoverable via PostgreSQL query', `Trips found: ${trips.length}`);
  assert(foundLogisticsB?.farmer?.village === 'Village Beta', 'Farmer details (village) correctly populated in trip query');

  // === STEP 9: Vehicle Capacity Validation on Trip Acceptance (Phase 21) ===
  console.log('\n--- Step 9: Server-side Vehicle Capacity Validation (Phase 21) ---');
  // Attempt to accept 600 kg load with 500 kg vehicle (Should REJECT 400)
  const smallVehAccept = await request(`/transporter/trips/${logisticsBId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenT}` },
    body: JSON.stringify({
      vehicleId: vehicle1Id,
    }),
  });
  assert(smallVehAccept.status === 400 && smallVehAccept.data.message.includes('capacity insufficient'), 'Insufficient vehicle capacity rejected by backend with HTTP 400', `Message: ${smallVehAccept.data.message}`);

  // Accept with 1.5 MT (1500 kg) vehicle (Should SUCCEED 200)
  const largeVehAccept = await request(`/transporter/trips/${logisticsBId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenT}` },
    body: JSON.stringify({
      vehicleId: vehicle2Id,
    }),
  });
  assert(largeVehAccept.status === 200 && largeVehAccept.data.data?.trip?.status === 'Assigned', 'Trip accepted with sufficient vehicle capacity');

  // === STEP 10: Farmer B sees Transporter & Vehicle Assignment (Phase 23) ===
  console.log('\n--- Step 10: Farmer B Assignment Visibility (Phase 23) ---');
  const farmerBLogistics = await request('/farmer/logistics', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const logisticsList = (farmerBLogistics.data.data?.logisticsRequests || []) as Array<{ id: string; status?: string; vehicleRef?: { registration?: string }; transporter?: { fullName?: string } }>;
  const myTrip = logisticsList.find((l) => l.id === logisticsBId);
  assert(myTrip?.status === 'Assigned', 'Farmer B sees status updated to "Assigned"');
  assert(myTrip?.vehicleRef?.registration === plate2, `Farmer B sees assigned vehicle plate (${plate2})`);
  assert(myTrip?.transporter?.fullName === 'Transporter Tom', 'Farmer B sees assigned transporter name (Transporter Tom)');

  // === STEP 11: Relational DB Integrity Check (Phase 37) ===
  console.log('\n--- Step 11: Database Relational Integrity Check (Phase 37) ---');
  const dbTrip = await prisma.logisticsRequest.findUnique({
    where: { id: logisticsBId },
    include: {
      farmer: { include: { user: true } },
      transporter: { include: { user: true } },
      vehicleRef: true,
      product: true,
    },
  });
  assert(dbTrip?.farmer.userId !== undefined && dbTrip.farmer.userId === dbTrip.farmer.user.id, 'Relational FK: LogisticsRequest -> FarmerProfile -> User matches');
  assert(dbTrip?.transporter?.userId !== undefined && dbTrip.transporter.userId === dbTrip.transporter.user.id, 'Relational FK: LogisticsRequest -> TransporterProfile -> User matches');
  assert(dbTrip?.vehicleRef?.id === vehicle2Id, 'Relational FK: LogisticsRequest -> TransporterVehicle matches');
  assert(dbTrip?.product?.id === productBId, 'Relational FK: LogisticsRequest -> Product matches');
  assert(dbTrip?.status === 'Assigned', 'Relational DB status is Assigned');

  // === STEP 12: Role-based Authorization Check (RBAC 403) ===
  console.log('\n--- Step 12: RBAC Role Authorization Check (HTTP 403) ---');
  const buyerForbiddenOnFarmer = await request('/farmer/products', {
    headers: { Authorization: `Bearer ${tokenT}` }, // Transporter trying to access farmer products endpoint
  });
  assert(buyerForbiddenOnFarmer.status === 403, 'Role mismatch returns HTTP 403 Forbidden (RBAC works)');

  // === STEP 13: Buyer Registration & Procurement Workflow (Phase 12, 24) ===
  console.log('\n--- Step 13: Buyer Registration & Procurement Workflow ---');
  const regBuyer = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Buyer Bob',
      email: buyerEmail,
      password: 'Password123!',
      role: 'BUYER',
      phone: phoneBuyer,
      businessName: 'Fresh Foods Wholesale',
      businessType: 'Retailer',
      location: 'Pune Central Market',
    }),
  });
  const tokenBuyer = regBuyer.data.data?.token;

  // Buyer creates procurement demand
  const procRes = await request('/buyer/procurements', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenBuyer}` },
    body: JSON.stringify({
      product: 'Grade A Tomatoes',
      quantity: '500 kg',
      targetPrice: '₹40/kg',
      destination: 'Pune Central Market',
      requiredBy: '2026-09-01',
    }),
  });
  assert(procRes.status === 201 && !!procRes.data.data?.procurement?.id, 'Buyer Procurement created in PostgreSQL', `Procurement ID: ${procRes.data.data?.procurement?.id}`);
  const procurementId = procRes.data.data?.procurement?.id;

  // Market discovery of open demands
  const openDemandsRes = await request('/market/demands');
  const openDemands = (openDemandsRes.data.data?.procurements || []) as Array<{ id: string }>;
  const foundDemand = openDemands.find((d) => d.id === procurementId);
  assert(!!foundDemand, 'Platform-wide market demand discovery query finds open buyer procurement in PostgreSQL');
}

async function main() {
  console.log('🚀 STARTING COMPREHENSIVE RURALFLOW VERIFICATION SUITE');
  try {
    await runJwtMatrix();
    await runE2EWorkflow();

    console.log('\n========================================');
    console.log('📊 TEST SUMMARY RESULTS');
    console.log('========================================');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed:      ${passed} ✅`);
    console.log(`Failed:      ${failed} ${failed > 0 ? '❌' : '🎉'}`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test suite runner crashed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
