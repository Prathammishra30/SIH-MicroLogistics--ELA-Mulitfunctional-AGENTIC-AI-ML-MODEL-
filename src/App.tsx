import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BackgroundNetwork } from './components/BackgroundNetwork';
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
import type { ModalType, SupportedLanguage } from './types';

export function App() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [isDark, setIsDark] = useState<boolean>(true);

  // Sync dark theme class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <SharedProvider>
        <div className="relative min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 transition-colors duration-300 font-sans">
        
        {/* Living Micro-Logistics Network Canvas Background */}
        <BackgroundNetwork isDark={isDark} />

        {/* Global Navigation Header */}
        <Navbar
          onOpenModal={(modal) => setActiveModal(modal)}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
          currentLang={currentLang}
          onChangeLang={(lang) => setCurrentLang(lang)}
        />

        {/* Dynamic Route Pages */}
        <Routes>
          {/* Unified Gateway */}
          <Route path="/" element={<Gateway currentLang={currentLang} />} />

          {/* Phase 2: Role Authentication Routes */}
          <Route path="/auth/farmer" element={<FarmerAuth />} />
          <Route path="/auth/transporter" element={<TransporterAuth />} />
          <Route path="/auth/buyer" element={<BuyerAuth />} />

          {/* Phase 3A: Farmer Dashboard Flow */}
          <Route path="/farmer" element={<FarmerLayout />}>
            <Route path="dashboard" element={<FarmerDashboard />} />
            <Route path="products" element={<FarmerProducts />} />
            <Route path="products/new" element={<FarmerAddProduct />} />
            <Route path="markets" element={<FarmerMarkets />} />
            <Route path="logistics" element={<FarmerLogisticsRequest />} />
            <Route path="deliveries" element={<FarmerDeliveries />} />
            <Route path="deliveries/:id" element={<FarmerDeliveryDetail />} />
          </Route>
          
          {/* Phase 3B: Transporter Dashboard Flow */}
          <Route path="/transporter" element={<TransporterLayout />}>
            <Route path="dashboard" element={<TransporterDashboard />} />
            <Route path="trips" element={<TransporterTrips />} />
            <Route path="trips/:id" element={<TransporterTripDetail />} />
            <Route path="active" element={<TransporterActiveTrips />} />
            <Route path="active/:id" element={<TransporterActiveTripDetail />} />
            <Route path="vehicles" element={<TransporterVehicles />} />
            <Route path="earnings" element={<TransporterEarnings />} />
            <Route path="performance" element={<TransporterPerformance />} />
          </Route>

          {/* Phase 3C: Buyer Dashboard Flow */}
          <Route path="/buyer" element={<BuyerLayout />}>
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
      </div>
      </SharedProvider>
    </BrowserRouter>
  );
}

export default App;
