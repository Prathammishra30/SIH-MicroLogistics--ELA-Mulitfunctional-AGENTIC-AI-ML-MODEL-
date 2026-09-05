import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Package,
  Truck,
  IndianRupee,
  Plus,
  ArrowRight,
  Eye,
  MapPin,
  Calendar,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';
import { PortalHero } from '../../components/ui/PortalHero';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MatchProposalCard, type MatchProposalData } from '../../components/dashboards/MatchProposalCard';
import { Sparkles, RefreshCw } from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const userName = state.auth.user?.name || 'Commercial Buyer';

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

  const activeProcurements = state.procurementRequests.filter(
    (pr) => pr.status !== 'Completed'
  );
  const openOrders = state.procurementRequests.filter(
    (pr) => pr.status === 'Open'
  );
  const incomingDeliveries = state.logisticsRequests.filter(
    (lr) => lr.status === 'In Transit' || lr.status === 'Assigned'
  );

  const totalSpend = activeProcurements.reduce((acc, pr) => {
    const qty = parseInt(pr.quantity, 10) || 500;
    const rate = parseInt(pr.targetPrice?.replace(/\D/g, '') || '30', 10);
    return acc + (qty * rate);
  }, 0);

  const formattedSpend = `₹${totalSpend.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Full-width Header Banner with Layered Gradient & Glowing Mesh */}
      <PortalHero
        role="buyer"
        title={`${t('dashboard.buyer.title') || 'Procurement Operations'} • ${userName}`}
        subtitle={
          t('dashboard.buyer.subtitle') ||
          'Manage bulk farm crop procurement requests, incoming deliveries, and wholesale demand.'
        }
        imageSrc="/images/wholesale_market.jpg"
        imageAlt="Wholesale market"
        actions={[
          {
            label: t('nav.buyer.postProcurement') || 'Post Procurement',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => navigate('/buyer/procurement'),
            primary: true,
          },
          {
            label: t('buyer.browseProduce') || 'Browse Produce',
            icon: <Package className="w-4 h-4" />,
            onClick: () => navigate('/buyer/produce'),
            primary: false,
          },
        ]}
      />

      {/* Top 4 Summary KPI Cards (Overlapping the Hero with CountUp & Glassmorphism) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 -mt-36 relative z-20 mx-2 sm:mx-0">
        <StatCard
          label={t('dashboard.activeProcurements') || 'Active Procurements'}
          value={activeProcurements.length}
          subtext={t('dashboard.inSourcing') || 'In sourcing / fulfilling'}
          icon={Store}
          colorScheme="blue"
          index={0}
        />
        <StatCard
          label={t('dashboard.openOrders') || 'Open Orders'}
          value={openOrders.length}
          subtext={t('dashboard.awaitingFarmer') || 'Awaiting farmer match'}
          icon={Package}
          colorScheme="amber"
          index={1}
        />
        <StatCard
          label={t('dashboard.incomingDeliveries') || 'Incoming Deliveries'}
          value={incomingDeliveries.length}
          subtext={t('dashboard.inTransitToDest') || 'In transit to destination'}
          icon={Truck}
          colorScheme="green"
          index={2}
        />
        <StatCard
          label={t('dashboard.committedVolume') || 'Committed Volume'}
          value={formattedSpend}
          subtext={t('dashboard.directSpend') || 'Direct procurement spend'}
          icon={IndianRupee}
          colorScheme="gray"
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
              <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
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
                currentRole="BUYER"
                onDecisionUpdated={handleProposalUpdated}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Main Table: Active Procurements with Scroll Reveal */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
        className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xl shadow-blue-950/5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{t('buyer.active_procurement_demands')}</h2>
            <p className="text-xs text-gray-500">
              {t('buyer.direct_procurement_orders_broa')}
            </p>
          </div>
          <button
            onClick={() => navigate('/buyer/orders')}
            className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer transition-transform hover:translate-x-0.5"
          >
            <span>{t('buyer.view_all_orders')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {state.procurementRequests.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 space-y-2">
            <Store className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-600 font-medium">{t('buyer.no_procurement_requests_posted')}</p>
            <button
              onClick={() => navigate('/buyer/procurement')}
              className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            >
              {t('buyer.post_your_first_bulk_requireme')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200/80 text-gray-500 font-semibold uppercase tracking-wider text-[10px] bg-gray-50/60">
                  <th className="py-3 px-3.5 rounded-l-xl">{t('farmer.product')}</th>
                  <th className="py-3 px-3">{t('farmer.quantity')}</th>
                  <th className="py-3 px-3">{t('buyer.required_by')}</th>
                  <th className="py-3 px-3">{t('buyer.delivery_location')}</th>
                  <th className="py-3 px-3">{t('buyer.target_price')}</th>
                  <th className="py-3 px-3">{t('farmer.status')}</th>
                  <th className="py-3 px-3 text-right rounded-r-xl">{t('farmer.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.procurementRequests.map((pr) => (
                  <tr
                    key={pr.id}
                    className="hover:bg-blue-50/40 transition-colors duration-150 group"
                  >
                    <td className="py-3.5 px-3.5 font-semibold text-gray-900">
                      {pr.product}
                    </td>
                    <td className="py-3.5 px-3 text-gray-700 font-mono">
                      {pr.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {pr.requiredBy || 'Immediate'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      <span className="flex items-center gap-1 text-gray-900">
                        <MapPin className="w-3 h-3 text-blue-700 shrink-0" />
                        <span className="truncate max-w-[140px]">{pr.destination}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#2E7D32] font-mono">
                      {pr.targetPrice}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={pr.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <motion.button
                        whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                        onClick={() => navigate(`/buyer/orders/${pr.id}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-white transition-colors cursor-pointer shadow-2xs"
                        title={t('buyer.view_procurement_order')}
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
    </div>
  );
};
