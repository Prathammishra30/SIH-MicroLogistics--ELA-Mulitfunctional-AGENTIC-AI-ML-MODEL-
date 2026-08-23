import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck,
  TrendingUp,
  MapPin,
  Route,
  LogOut,
  Sparkles,
  Gauge,
  CheckCircle2,
  Home,
  Clock
} from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const TransporterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  
  const availableTrips = state.logisticsRequests.filter(req => req.status === 'Searching');
  const activeTrips = state.logisticsRequests.filter(req => req.status !== 'Searching' && req.status !== 'Delivered');
  const currentActiveTrip = activeTrips[0] || null;

  // Compute real capacity utilization from active loads
  const calculateActiveUtilization = () => {
    if (activeTrips.length === 0) return 0;
    let totalKg = 0;
    activeTrips.forEach(trip => {
      if (trip.quantity) {
        if (trip.quantity.toLowerCase().includes('mt')) {
          totalKg += (parseFloat(trip.quantity) || 1) * 1000;
        } else if (trip.quantity.toLowerCase().includes('kg')) {
          totalKg += parseFloat(trip.quantity) || 500;
        } else {
          totalKg += 500;
        }
      } else {
        totalKg += 500;
      }
    });
    // Transporter vehicle capacity = 2.0 MT = 2000 kg (Bolero Pickup)
    const capacityKg = 2000;
    return Math.min(100, Math.round((totalKg / capacityKg) * 100));
  };

  const dynamicUtilization = calculateActiveUtilization();

  // Dynamic MTD Earnings
  const baseEarnings = 32450;
  const deliveredTrips = state.logisticsRequests.filter(req => req.status === 'Delivered');
  const deliveredEarnings = deliveredTrips.reduce((sum, req) => {
    const numeric = parseInt(req.estimatedEarnings?.replace(/[^0-9]/g, '') || '1850', 10);
    return sum + (isNaN(numeric) ? 1850 : numeric);
  }, 0);
  const totalEarnings = baseEarnings + deliveredEarnings;

  return (
    <div className="relative min-h-screen flex flex-col justify-between z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full text-slate-100">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-md">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Good morning, Transporter 👋
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Active Fleet Partner
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sunil Deshmukh • Bolero Pickup (MH 12 AB 1234 • 2.0 MT Capacity)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Gateway</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/auth/transporter')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Phase 3 Notice Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-sky-300"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
          <span>
            <strong>Transport Operations Center:</strong> Live multi-hop route clustering and active telematics synchronization enabled.
          </span>
        </div>
        <span className="hidden md:inline-block px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold uppercase tracking-wider shrink-0">
          Live Logistics Operations
        </span>
      </motion.div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
        <div 
          onClick={() => navigate('/transporter/trips')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Trips</span>
            <Route className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{availableTrips.length} Nearby</span>
            <span className="text-xs text-sky-400 block mt-1">Click to view & accept</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/transporter/active')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Deliveries</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{activeTrips.length} Assigned</span>
            <span className="text-xs text-emerald-400 block mt-1">Manage status progression</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/transporter/performance')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Vehicle Utilization</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{dynamicUtilization}% Capacity</span>
            <span className="text-xs text-amber-400 block mt-1">{activeTrips.length > 0 ? `${activeTrips.length} active load(s)` : 'Vehicle idle'}</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/transporter/earnings')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Earnings (MTD)</span>
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">₹{totalEarnings.toLocaleString()}</span>
            <span className="text-xs text-violet-400 block mt-1">{deliveredTrips.length} completed trips</span>
          </div>
        </div>
      </div>

      {/* 3 Main Functional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Section 1: Recommended Trips */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Route className="w-4 h-4 text-sky-400" />
              <span>Recommended Pooled Trips</span>
            </h2>
            <span className="text-[11px] text-sky-400 font-semibold">{availableTrips.length > 0 ? `${availableTrips.length} Live Ready` : 'AI Matched'}</span>
          </div>

          <div className="space-y-3">
            {availableTrips.length > 0 ? (
              availableTrips.slice(0, 2).map((trip) => (
                <div 
                  key={trip.id}
                  onClick={() => navigate(`/transporter/trips/${trip.id}`)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/30 hover:border-sky-500/60 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{trip.productName}</span>
                    <span className="text-emerald-400 font-bold font-mono">{trip.estimatedEarnings || '₹1,850'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Load: {trip.quantity || 'Standard'} • From: {trip.pickupLocation || 'Farm Gate'} ➔ {trip.destination}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-semibold">Live Farmer Demand • {trip.id}</span>
                    <span className="text-sky-400 font-semibold">Click to Accept →</span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div 
                  onClick={() => navigate('/transporter/trips')}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-sky-500/30 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Satara Hub ➔ Pune APMC</span>
                    <span className="text-emerald-400 font-bold font-mono">₹4,200 Payout</span>
                  </div>
                  <p className="text-[11px] text-slate-400">1.4 MT Agri-Load (Tomatoes & Onions) • 2 Pickup Nodes</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Includes return freight guarantee</span>
                    <span className="text-sky-400 font-semibold">92% Space Filled</span>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/transporter/trips')}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-sky-500/30 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Wai Cluster ➔ Vashi Terminal</span>
                    <span className="text-emerald-400 font-bold font-mono">₹6,800 Payout</span>
                  </div>
                  <p className="text-[11px] text-slate-400">1.8 MT Handcraft & Spices • Single Dispatch</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Starts tomorrow 6:00 AM</span>
                    <span className="text-amber-400 font-semibold">Urgent Pickup</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Active Route */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Active Route Progress</span>
            </h2>
            <span className="text-[11px] text-emerald-400 font-semibold">Live Run</span>
          </div>

          {currentActiveTrip ? (
          <div 
            onClick={() => navigate(`/transporter/active/${currentActiveTrip.id}`)}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 transition-all cursor-pointer space-y-3.5"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Trip ID:</span>
              <strong className="text-white font-mono">{currentActiveTrip.id}</strong>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Pickup: {currentActiveTrip.pickupLocation || 'Farm Gate'}</span>
              </div>
              <div className="flex items-center gap-2 text-sky-400">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Load: {currentActiveTrip.productName} ({currentActiveTrip.quantity || 'TBD'})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Drop-off: {currentActiveTrip.destination}</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${
                currentActiveTrip.status === 'Assigned' ? 'bg-sky-500 w-1/5' :
                currentActiveTrip.status === 'At Pickup' ? 'bg-sky-500 w-2/5' :
                currentActiveTrip.status === 'Picked Up' ? 'bg-sky-500 w-3/5' :
                currentActiveTrip.status === 'In Transit' ? 'bg-emerald-500 w-4/5' :
                'bg-emerald-500 w-full'
              }`} />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Status: <strong className="text-sky-400">{currentActiveTrip.status}</strong></span>
              <span className="text-emerald-400 font-semibold">Update Progress →</span>
            </div>
          </div>
          ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-sm text-slate-500">
            No active route. Accept a trip to begin.
          </div>
          )}
        </div>

        {/* Section 3: Vehicle Status */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Gauge className="w-4 h-4 text-violet-400" />
              <span>Vehicle & Health Status</span>
            </h2>
            <span className="text-[11px] text-slate-400">Fleet ID: V-881</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">RC & Fitness Status</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Valid till 2028
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Commercial Goods Insurance</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Comprehensive Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Backhaul Matching</span>
              <span className="text-sky-400 font-semibold">Enabled (Auto-reserve)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/transporter/vehicles')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors mt-2"
          >
            Manage Vehicle Fleet Details →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
        <span>RuralFlow • Transporter Fleet & Capacity Management Portal</span>
      </footer>
    </div>
  );
};
