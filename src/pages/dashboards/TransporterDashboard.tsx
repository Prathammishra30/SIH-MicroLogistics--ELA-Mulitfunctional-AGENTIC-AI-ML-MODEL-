import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Car,
  Route,
  IndianRupee,
  MapPin,
  ArrowRight,
  Plus,
  Eye,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';
import { PortalHero } from '../../components/ui/PortalHero';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MatchProposalCard, type MatchProposalData } from '../../components/dashboards/MatchProposalCard';
import { Sparkles, RefreshCw } from 'lucide-react';

export const TransporterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const userName = state.auth.user?.name || 'Transporter';

  // Cross-role match proposals state
  const [proposals, setProposals] = React.useState<MatchProposalData[]>([]);
  const [loadingProposals, setLoadingProposals] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch('/api/ela/matches')
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.data?.proposals) {
          setProposals(data.data.proposals);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    setLoadingProposals(true);
    try {
      const res = await fetch('/api/ela/matches');
      const data = await res.json();
      if (data.success && data.data?.proposals) {
        setProposals(data.data.proposals);
      }
    } catch {
      // offline/fallback
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleProposalUpdated = (updated: MatchProposalData) => {
    setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const nearbyRequests = state.logisticsRequests.filter(
    (req) => req.status === 'Searching'
  );
  const activeTrips = state.logisticsRequests.filter(
    (req) => req.status === 'Assigned' || req.status === 'In Transit'
  );
  const availableVehicles = state.vehicles.filter(
    (v) => v.status === 'Available'
  ).length;

  const deliveredTrips = state.logisticsRequests.filter((req) => req.status === 'Delivered');
  const deliveredEarnings = deliveredTrips.reduce((sum, req) => {
    const numeric = parseInt(req.estimatedEarnings?.replace(/[^0-9]/g, '') || '1850', 10);
    return sum + (isNaN(numeric) ? 1850 : numeric);
  }, 0);
  const formattedEarnings = `₹${(deliveredEarnings).toLocaleString('en-IN')}`;

  const primaryVehicle = state.vehicles[0];

  return (
    <div className="space-y-6">
      {/* Full-width Header Banner with Layered Gradient & Glowing Mesh */}
      <PortalHero
        role="transporter"
        title={`${t('dashboard.transporter.title') || 'Transporter Dispatch Control'} • ${userName}`}
        subtitle={
          primaryVehicle
            ? `${t('transporter.primary_fleet') || 'Primary Fleet:'} ${primaryVehicle.type} (${primaryVehicle.registration} • ${primaryVehicle.capacity})`
            : t('dashboard.transporter.subtitle') ||
              'Fleet operations overview, nearby farm pickup loads, and vehicle management.'
        }
        imageSrc="/images/truck_route.jpg"
        imageAlt="Truck Route"
        actions={[
          {
            label: t('transporter.manageFleet') || 'Manage Fleet',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => navigate('/transporter/vehicles'),
            primary: true,
          },
          {
            label: t('dashboard.findLoads') || 'Find Loads',
            icon: <Route className="w-4 h-4" />,
            onClick: () => navigate('/transporter/trips'),
            primary: false,
          },
        ]}
      />

      {/* Top 4 Summary KPI Cards (Overlapping the Hero with CountUp & Glassmorphism) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 -mt-36 relative z-20 mx-2 sm:mx-0">
        <StatCard
          label={t('dashboard.activeTrips') || 'Active Trips'}
          value={activeTrips.length}
          subtext={t('dashboard.currentlyEnRoute') || 'Currently en route'}
          icon={Truck}
          colorScheme="amber"
          index={0}
        />
        <StatCard
          label={t('dashboard.availableFleet') || 'Available Fleet'}
          value={availableVehicles}
          subtext={t('dashboard.readyForDispatch') || 'Ready for dispatch'}
          icon={Car}
          colorScheme="green"
          index={1}
        />
        <StatCard
          label={t('dashboard.nearbyRequests') || 'Nearby Requests'}
          value={nearbyRequests.length}
          subtext={t('dashboard.eligiblePickupLoads') || 'Eligible pickup loads'}
          icon={Route}
          colorScheme="blue"
          index={2}
        />
        <StatCard
          label={t('dashboard.totalRevenue') || 'Total Revenue'}
          value={formattedEarnings}
          subtext={t('dashboard.freightEarnings') || 'Freight payout earnings'}
          icon={IndianRupee}
          colorScheme="emerald"
          index={3}
        />
      </div>

      {/* ELA Cross-Role Match Proposals Section */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-100 text-amber-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-gray-900">{t('match.sectionTitle')}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{t('match.sectionSubtitle')}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loadingProposals}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingProposals ? 'animate-spin' : ''}`} />
            <span>{loadingProposals ? t('match.finding') : t('match.findMatchesBtn')}</span>
          </button>
        </div>

        {proposals.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-dashed border-gray-200 text-center text-xs text-gray-500">
            {t('match.noMatches')}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {proposals.map((proposal) => (
              <MatchProposalCard
                key={proposal.id}
                proposal={proposal}
                currentRole="TRANSPORTER"
                onDecisionUpdated={handleProposalUpdated}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Main Table: Nearby Logistics Requests with Scroll Reveal */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
        className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xl shadow-amber-950/5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{t('transporter.nearby_logistics_requests')}</h2>
            <p className="text-xs text-gray-500">
              {t('transporter.unfulfilled_farm_harvest_loads')}
            </p>
          </div>
          <button
            onClick={() => navigate('/transporter/trips')}
            className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer transition-transform hover:translate-x-0.5"
          >
            <span>{t('transporter.view_all_trips')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {state.logisticsRequests.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 space-y-2">
            <Truck className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-600 font-medium">{t('transporter.no_nearby_logistics_requests_r')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200/80 text-gray-500 font-semibold uppercase tracking-wider text-[10px] bg-gray-50/60">
                  <th className="py-3 px-3.5 rounded-l-xl">{t('farmer.product')}</th>
                  <th className="py-3 px-3">{t('farmer.quantity')}</th>
                  <th className="py-3 px-3">{t('transporter.pickup_location')}</th>
                  <th className="py-3 px-3">{t('farmer.destination_2')}</th>
                  <th className="py-3 px-3">{t('transporter.required_capacity')}</th>
                  <th className="py-3 px-3">{t('transporter.estimated_earnings')}</th>
                  <th className="py-3 px-3">{t('farmer.status')}</th>
                  <th className="py-3 px-3 text-right rounded-r-xl">{t('farmer.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.logisticsRequests.slice(0, 6).map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-amber-50/40 transition-colors duration-150 group"
                  >
                    <td className="py-3.5 px-3.5 font-semibold text-gray-900">
                      {req.productName}
                    </td>
                    <td className="py-3.5 px-3 text-gray-600 font-mono">
                      {req.quantity || 'N/A'}
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      <span className="flex items-center gap-1 text-gray-900">
                        <MapPin className="w-3 h-3 text-green-700 shrink-0" />
                        <span className="truncate max-w-[120px]">{req.pickupLocation || 'Farm Gate'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      <span className="flex items-center gap-1 text-gray-900">
                        <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                        <span className="truncate max-w-[120px]">{req.destination}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-600 font-mono">
                      {req.quantity?.includes('MT') ? req.quantity : '1.5 - 2.0 MT'}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-[#2E7D32] font-mono">
                      {req.estimatedEarnings || '₹0'}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {req.status === 'Searching' ? (
                        <motion.button
                          whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                          whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                          onClick={() => navigate(`/transporter/trips/${req.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-[11px] transition-colors cursor-pointer shadow-xs hover:shadow-amber-700/20"
                        >
                          {t('transporter.accept')}
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
                          whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                          onClick={() => navigate(`/transporter/trips/${req.id}`)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-white transition-colors cursor-pointer shadow-2xs"
                          title={t('transporter.view_details')}
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Active Trip Progress Card if one is in progress */}
      {activeTrips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-6 rounded-3xl bg-white border border-amber-200/90 shadow-xl shadow-amber-950/5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600" />
              </span>
              <h3 className="text-sm font-bold text-gray-900">
                {t('transporter.live_dispatched_trip_in_progre')}{activeTrips[0].id}
              </h3>
            </div>
            <button
              onClick={() => navigate(`/transporter/active/${activeTrips[0].id}`)}
              className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
            >
              {t('transporter.update_progress_')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs">
            <div>
              <span className="text-gray-500">{t('transporter.cargo')}</span>
              <strong className="text-gray-900 block font-medium">{activeTrips[0].productName} ({activeTrips[0].quantity})</strong>
            </div>
            <div>
              <span className="text-gray-500">{t('transporter.route')}</span>
              <span className="text-gray-900 font-medium block truncate">
                {activeTrips[0].pickupLocation || 'Farm'} → {activeTrips[0].destination}
              </span>
            </div>
            <div>
              <span className="text-gray-500">{t('transporter.current_status')}</span>
              <div className="mt-1">
                <StatusBadge status={activeTrips[0].status} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
