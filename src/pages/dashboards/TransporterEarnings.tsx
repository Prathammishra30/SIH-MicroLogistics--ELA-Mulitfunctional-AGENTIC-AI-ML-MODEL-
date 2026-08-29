import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, IndianRupee, CheckCircle2 } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from "../../context/LanguageContext";

export const TransporterEarnings: React.FC = () => {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const { state } = useSharedContext();

  const deliveredTrips = state.logisticsRequests.filter((req) => req.status === 'Delivered');
  const deliveredEarnings = deliveredTrips.reduce((sum, req) => {
    const numeric = parseInt(req.estimatedEarnings?.replace(/[^0-9]/g, '') || '1850', 10);
    return sum + (isNaN(numeric) ? 1850 : numeric);
  }, 0);

  const formattedEarnings = `₹${(deliveredEarnings || 24500).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          onClick={() => navigate('/transporter/dashboard')}
          className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-green-700" />
            {t('transporter.transporter_earnings_payouts')}</h1>
          <p className="text-xs text-gray-500">{t('transporter.track_trip_settlements_and_rur')}</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs text-gray-500 font-medium">{t('transporter.month_to_date_earnings')}</span>
          <div className="text-2xl font-bold text-gray-900">{formattedEarnings}</div>
          <span className="text-[11px] text-[#2E7D32] font-semibold">{t('transporter.direct_dbt_account_deposit')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs text-gray-500 font-medium">{t('transporter.completed_deliveries')}</span>
          <div className="text-2xl font-bold text-gray-900">{deliveredTrips.length || 8}</div>
          <span className="text-[11px] text-gray-500">{t('transporter.verified_by_receiving_buyers')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs text-gray-500 font-medium">{t('transporter.average_fare_trip')}</span>
          <div className="text-2xl font-bold text-gray-900">₹2,150</div>
          <span className="text-[11px] text-amber-800 font-semibold">{t('transporter.capacityoptimized_routes')}</span>
        </div>
      </div>

      {/* Completed Payouts Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-gray-900">{t('transporter.settled_freight_trips')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px] bg-gray-50/50">
                <th className="py-2.5 px-3">{t('transporter.trip_id')}</th>
                <th className="py-2.5 px-3">{t('transporter.product_load')}</th>
                <th className="py-2.5 px-3">{t('transporter.route_10')}</th>
                <th className="py-2.5 px-3">{t('farmer.status')}</th>
                <th className="py-2.5 px-3 text-right">{t('transporter.settled_amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deliveredTrips.map((dt) => (
                <tr key={dt.id}>
                  <td className="py-3 px-3 font-mono font-bold text-gray-900">#{dt.id}</td>
                  <td className="py-3 px-3 text-gray-700">{dt.productName} ({dt.quantity})</td>
                  <td className="py-3 px-3 text-gray-600">{dt.pickupLocation || 'Farm'} → {dt.destination}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-green-200">
                      <CheckCircle2 className="w-3 h-3" /> {t('transporter.settled')}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#2E7D32] font-mono">
                    {dt.estimatedEarnings || '₹1,850'}
                  </td>
                </tr>
              ))}
              {deliveredTrips.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                    {t('transporter.complete_trips_to_view_verifie')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
