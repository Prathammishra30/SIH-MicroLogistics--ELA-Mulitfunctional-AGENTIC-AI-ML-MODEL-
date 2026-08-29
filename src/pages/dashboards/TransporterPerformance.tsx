import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from "../../context/LanguageContext";

export const TransporterPerformance: React.FC = () => {
    const { t } = useLanguage();
  const navigate = useNavigate();

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
            <Activity className="w-5 h-5 text-amber-700" />
            {t('transporter.fleet_utilization_reliability_')}</h1>
          <p className="text-xs text-gray-500">{t('transporter.realtime_telematics_and_driver')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs text-gray-500 font-medium">{t('transporter.ontime_delivery_rate')}</span>
          <div className="text-2xl font-bold text-[#2E7D32]">98.4%</div>
          <span className="text-[11px] text-gray-500">{t('transporter.across_36_completed_dispatch_c')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs text-gray-500 font-medium">{t('transporter.average_fleet_utilization')}</span>
          <div className="text-2xl font-bold text-gray-900">86.2%</div>
          <span className="text-[11px] text-amber-800 font-semibold">{t('transporter.shared_rural_multistop_pooling')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
          <span className="text-xs text-gray-500 font-medium">{t('transporter.driver_quality_rating')}</span>
          <div className="text-2xl font-bold text-blue-700">4.9 / 5.0</div>
          <span className="text-[11px] text-gray-500">{t('transporter.verified_producer_buyer_feedba')}</span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-gray-900">{t('transporter.vehicle_health_compliance_stat')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2E7D32]" />
            <div>
              <span className="font-bold text-gray-900 block">{t('transporter.commercial_insurance_fitness')}</span>
              <span className="text-gray-500">{t('transporter.valid_through_november_2027')}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
            <div>
              <span className="font-bold text-gray-900 block">{t('transporter.pollution_puc_clearance')}</span>
              <span className="text-gray-500">{t('transporter.verified_green_compliance')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
