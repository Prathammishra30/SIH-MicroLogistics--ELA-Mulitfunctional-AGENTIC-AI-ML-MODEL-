import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Modals } from './components/Modals';
import { Gateway } from './pages/Gateway';
import { FarmerAuth } from './pages/auth/FarmerAuth';
import { TransporterAuth } from './pages/auth/TransporterAuth';
import { BuyerAuth } from './pages/auth/BuyerAuth';
import { FarmerDashboard } from './pages/dashboards/FarmerDashboard';
import { FarmerProducts } from './pages/dashboards/FarmerProducts';
import { FarmerAddProduct } from './pages/dashboards/FarmerAddProduct';
import { FarmerMarkets } from './pages/dashboards/FarmerMarkets';
import { FarmerLogisticsRequest } from './pages/dashboards/FarmerLogisticsRequest';
import { FarmerDeliveries } from './pages/dashboards/FarmerDeliveries';
import { FarmerDeliveryDetail } from './pages/dashboards/FarmerDeliveryDetail';
import { FarmerLayout } from './pages/dashboards/FarmerLayout';
import { TransporterLayout } from './pages/dashboards/TransporterLayout';
import { TransporterDashboard } from './pages/dashboards/TransporterDashboard';
import { TransporterTrips } from './pages/dashboards/TransporterTrips';
import { TransporterTripDetail } from './pages/dashboards/TransporterTripDetail';
import { TransporterActiveTrips } from './pages/dashboards/TransporterActiveTrips';
import { TransporterActiveTripDetail } from './pages/dashboards/TransporterActiveTripDetail';
import { TransporterVehicles } from './pages/dashboards/TransporterVehicles';
import { TransporterEarnings } from './pages/dashboards/TransporterEarnings';
import { TransporterPerformance } from './pages/dashboards/TransporterPerformance';
import { BuyerLayout } from './pages/dashboards/BuyerLayout';
import { BuyerDashboard } from './pages/dashboards/BuyerDashboard';
import { BuyerProcurementForm } from './pages/dashboards/BuyerProcurementForm';
import { BuyerOrders } from './pages/dashboards/BuyerOrders';
import { BuyerOrderDetail } from './pages/dashboards/BuyerOrderDetail';
import { BuyerProduceMarket } from './pages/dashboards/BuyerProduceMarket';
import { SharedProvider } from './context/SharedContext';
import { Notifications } from './components/dashboards/Notifications';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LanguageProvider } from './context/LanguageContext';
import { ElaProvider } from './context/ElaContext';
import { ElaAssistant } from './components/ela/ElaAssistant';
import type { ModalType } from './types';

export function App() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  return (
    <BrowserRouter>
      <LanguageProvider>
        <ElaProvider>
          <SharedProvider>
            <div className="relative min-h-screen flex flex-col justify-between bg-[#F8FAF8] text-slate-800 font-sans antialiased">
            {/* Global Navigation Header */}
            <Navbar
              onOpenModal={(modal) => setActiveModal(modal)}
            />

          {/* Dynamic Route Pages */}
          <Routes>
            {/* Unified Gateway / Public Landing */}
            <Route path="/" element={<Gateway />} />

            {/* Role Authentication Routes */}
            <Route path="/auth/farmer" element={<FarmerAuth />} />
            <Route path="/auth/transporter" element={<TransporterAuth />} />
            <Route path="/auth/buyer" element={<BuyerAuth />} />

            {/* Farmer Dashboard Flow (Protected for FARMER) */}
            <Route
              path="/farmer"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
                  <FarmerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<FarmerDashboard />} />
              <Route path="products" element={<FarmerProducts />} />
              <Route path="products/new" element={<FarmerAddProduct />} />
              <Route path="markets" element={<FarmerMarkets />} />
              <Route path="logistics" element={<FarmerLogisticsRequest />} />
              <Route path="deliveries" element={<FarmerDeliveries />} />
              <Route path="deliveries/:id" element={<FarmerDeliveryDetail />} />
            </Route>

            {/* Transporter Dashboard Flow (Protected for TRANSPORTER) */}
            <Route
              path="/transporter"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORTER', 'ADMIN']}>
                  <TransporterLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<TransporterDashboard />} />
              <Route path="trips" element={<TransporterTrips />} />
              <Route path="trips/:id" element={<TransporterTripDetail />} />
              <Route path="active" element={<TransporterActiveTrips />} />
              <Route path="active/:id" element={<TransporterActiveTripDetail />} />
              <Route path="vehicles" element={<TransporterVehicles />} />
              <Route path="earnings" element={<TransporterEarnings />} />
              <Route path="performance" element={<TransporterPerformance />} />
            </Route>

            {/* Buyer Dashboard Flow (Protected for BUYER) */}
            <Route
              path="/buyer"
              element={
                <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
                  <BuyerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<BuyerDashboard />} />
              <Route path="procurement" element={<BuyerProcurementForm />} />
              <Route path="orders" element={<BuyerOrders />} />
              <Route path="orders/:id" element={<BuyerOrderDetail />} />
              <Route path="produce" element={<BuyerProduceMarket />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Interactive Modals (How It Works / About / Contact) */}
          <Modals
            activeModal={activeModal}
            onClose={() => setActiveModal(null)}
          />

          {/* Global Notifications */}
          <Notifications />

          {/* ELA Multilingual Agentic Assistant */}
          <ElaAssistant />
        </div>
        </SharedProvider>
        </ElaProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
