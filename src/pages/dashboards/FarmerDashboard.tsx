import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  Truck,
  ArrowRight,
  Clock,
  Plus,
  IndianRupee,
  Eye,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { QuickActions } from '../../components/dashboards/QuickActions';
import type { QuickAction } from '../../components/dashboards/QuickActions';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';
import { PortalHero } from '../../components/ui/PortalHero';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MatchProposalCard, type MatchProposalData } from '../../components/dashboards/MatchProposalCard';
import { Sparkles, RefreshCw } from 'lucide-react';

export const FarmerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const userName = state.auth.user?.name || 'Farmer';

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

  // Metrics calculations
  const totalProducts = state.products.length;
  const activeLogistics = state.logisticsRequests.filter(
    (lr) => lr.status === 'Assigned' || lr.status === 'In Transit'
  ).length;
  const pendingRequests = state.logisticsRequests.filter(
    (lr) => lr.status === 'Searching'
  ).length;

  // Earnings estimate based on completed or active transactions
  const totalEarningsVal = state.products.reduce((acc, p) => {
    const qty = parseInt(p.quantity, 10) || 0;
    return acc + (qty * 25);
  }, 0);

  const formattedEarnings = `₹${totalEarningsVal.toLocaleString('en-IN')}`;

  // Live buyer demands
  const liveBuyerDemands = state.procurementRequests.filter((pr) => pr.status === 'Open');

  // Quick actions with localized labels
  const quickActions: QuickAction[] = [
    {
      id: 'qa-1',
      label: t('action.addProduce') || 'Add Produce',
      icon: <Plus className="w-5 h-5" />,
      colorClass: 'bg-[#E8F5E9] text-[#2E7D32]',
      onClick: () => navigate('/farmer/products/new'),
    },
    {
      id: 'qa-2',
      label: t('nav.farmer.products') || 'My Products',
      icon: <Package className="w-5 h-5" />,
      colorClass: 'bg-[#E8F5E9] text-[#2E7D32]',
      onClick: () => navigate('/farmer/products'),
    },
    {
      id: 'qa-3',
      label: t('farmer.bookLogistics') || 'Request Transport',
      icon: <Truck className="w-5 h-5" />,
      colorClass: 'bg-amber-50 text-amber-800',
      onClick: () => navigate('/farmer/logistics'),
    },
    {
      id: 'qa-4',
      label: t('nav.farmer.markets') || 'Market Demand',
      icon: <TrendingUp className="w-5 h-5" />,
      colorClass: 'bg-blue-50 text-blue-700',
      onClick: () => navigate('/farmer/markets'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Full-width Welcome Banner with Layered Gradient & Glowing Mesh */}
      <PortalHero
        role="farmer"
        title={`${t('dashboard.welcome') || 'Welcome back'}, ${userName}`}
        subtitle={
          t('dashboard.farmer.subtitle') ||
          'Agricultural operations overview, logistics status, and regional mandi demand.'
        }
        imageSrc="/images/indian_farm.jpg"
        imageAlt="Indian farm"
        actions={[
          {
            label: t('action.addProduce') || 'Add Produce',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => navigate('/farmer/products/new'),
            primary: true,
          },
          {
            label: t('farmer.bookLogistics') || 'Book Logistics',
            icon: <Truck className="w-4 h-4" />,
            onClick: () => navigate('/farmer/logistics'),
            primary: false,
          },
        ]}
      />

      {/* Top 4 Summary KPI Cards (Overlapping the Hero with CountUp & Glassmorphism) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 -mt-36 relative z-20 mx-2 sm:mx-0">
        <StatCard
          label={t('dashboard.totalProducts') || 'Total Products'}
          value={totalProducts}
          subtext={t('dashboard.listedInCatalog') || 'Listed in catalog'}
          icon={Package}
          colorScheme="green"
          index={0}
        />
        <StatCard
          label={t('dashboard.activeLogistics') || 'Active Logistics'}
          value={activeLogistics}
          subtext={t('dashboard.inTransit') || 'In transit / assigned'}
          icon={Truck}
          colorScheme="amber"
          index={1}
        />
        <StatCard
          label={t('dashboard.pendingRequests') || 'Pending Requests'}
          value={pendingRequests}
          subtext={t('dashboard.searchingVehicles') || 'Searching for vehicles'}
          icon={Clock}
          colorScheme="blue"
          index={2}
        />
        <StatCard
          label={t('dashboard.potentialValue') || 'Est. Value'}
          value={formattedEarnings}
          subtext={t('dashboard.basedOnCatalog') || 'Based on active catalog'}
          icon={IndianRupee}
          colorScheme="emerald"
          index={3}
        />
      </div>

      {/* Quick Actions with Micro-animations */}
      <QuickActions actions={quickActions} />

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
              <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
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
                currentRole="FARMER"
                onDecisionUpdated={handleProposalUpdated}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Main Grid: Active Logistics Table & Market Demand with Scroll Reveal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent / Active Logistics Table */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
          className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xl shadow-green-950/5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">{t('farmer.recent_active_logistics')}</h2>
              <p className="text-xs text-gray-500">{t('farmer.realtime_status_of_your_agricu')}</p>
            </div>
            <button
              onClick={() => navigate('/farmer/deliveries')}
              className="text-xs font-semibold text-[#2E7D32] hover:underline flex items-center gap-1 cursor-pointer transition-transform hover:translate-x-0.5"
            >
              <span>{t('farmer.view_all')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {state.logisticsRequests.length === 0 ? (
            <div className="p-8 text-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 space-y-2">
              <Truck className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-xs text-gray-600 font-medium">{t('farmer.no_active_logistics_requests_y')}</p>
              <button
                onClick={() => navigate('/farmer/logistics')}
                className="text-xs font-bold text-[#2E7D32] hover:underline cursor-pointer"
              >
                {t('farmer.create_your_first_transport_re')}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200/80 text-gray-500 font-semibold uppercase tracking-wider text-[10px] bg-gray-50/60">
                    <th className="py-3 px-3.5 rounded-l-xl">{t('farmer.product')}</th>
                    <th className="py-3 px-3">{t('farmer.quantity')}</th>
                    <th className="py-3 px-3">{t('farmer.pickup_dest')}</th>
                    <th className="py-3 px-3">{t('farmer.transporter')}</th>
                    <th className="py-3 px-3">{t('farmer.status')}</th>
                    <th className="py-3 px-3 text-right rounded-r-xl">{t('farmer.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {state.logisticsRequests.slice(0, 5).map((lr) => (
                    <tr
                      key={lr.id}
                      className="hover:bg-green-50/40 transition-colors duration-150 group"
                    >
                      <td className="py-3.5 px-3.5 font-semibold text-gray-900">
                        {lr.productName}
                      </td>
                      <td className="py-3.5 px-3 text-gray-600 font-mono">
                        {lr.quantity}
                      </td>
                      <td className="py-3.5 px-3 text-gray-600">
                        <div className="font-medium text-gray-900 truncate max-w-[120px]">{lr.pickupLocation || 'Farm Gate'}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[120px]">→ {lr.destination}</div>
                      </td>
                      <td className="py-3.5 px-3 text-gray-600">
                        {lr.driver ? (
                          <div>
                            <div className="font-medium text-gray-900">{lr.driver}</div>
                            <div className="text-[10px] text-gray-500">{lr.vehicle || 'Assigned'}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">{t('farmer.searching_driver')}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={lr.status} />
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <motion.button
                          whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
                          whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                          onClick={() => navigate(`/farmer/deliveries/${lr.id}`)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-white transition-colors cursor-pointer shadow-2xs"
                          title={t('farmer.view_shipment_details')}
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Right 1 Col: Live Market Demand Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.45,
            delay: shouldReduceMotion ? 0 : 0.1,
          }}
          className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xl shadow-green-950/5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">{t('farmer.market_opportunities')}</h2>
              <p className="text-xs text-gray-500">{t('farmer.live_demand_from_buyers_apmc_m')}</p>
            </div>
            <button
              onClick={() => navigate('/farmer/markets')}
              className="text-xs font-semibold text-[#2E7D32] hover:underline cursor-pointer"
            >
              {t('farmer.explore')}
            </button>
          </div>

          <div className="space-y-3">
            {liveBuyerDemands.length > 0 ? (
              liveBuyerDemands.slice(0, 3).map((dem) => (
                <div
                  key={dem.id}
                  className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200/70 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-150 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{dem.product}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {t('farmer.buyer_order')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{t('farmer.target')}<strong className="text-gray-900 font-mono">{dem.targetPrice}</strong></span>
                    <span>{t('farmer.quantity_1')}<strong className="text-gray-900 font-mono">{dem.quantity}</strong></span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {t('farmer.buyer')}{dem.buyerName} {t('farmer._delivery_to')}{dem.destination}
                  </div>
                </div>
              ))
            ) : (
              state.marketOpportunities.slice(0, 3).map((opp) => (
                <div
                  key={opp.id}
                  className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200/70 hover:border-green-200 hover:bg-green-50/30 transition-all duration-150 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{opp.demandItem}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-[#2E7D32] border border-green-200">
                      {t('farmer.mandi_price')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{t('farmer.mandi_rate')}<strong className="text-gray-900 font-mono">{opp.price}</strong></span>
                    <span>{t('farmer.req')}<strong className="text-gray-900 font-mono">{opp.quantityRequired}</strong></span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {t('farmer.destination')}{opp.buyer}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => navigate('/farmer/markets')}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-100/90 hover:bg-gray-200/90 text-gray-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>{t('farmer.view_all_market_demands')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
