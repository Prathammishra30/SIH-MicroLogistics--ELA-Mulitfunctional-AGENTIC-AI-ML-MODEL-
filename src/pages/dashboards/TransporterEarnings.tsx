import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';

export const TransporterEarnings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full text-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/transporter/dashboard')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-violet-400" />
          Earnings Overview
        </h1>
      </div>
      <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 border-dashed text-slate-400">
        <h2 className="text-xl text-white mb-2">Month to Date: ₹32,450</h2>
        <p>Detailed earnings breakdown and automated direct bank settlements will be enabled in Phase 3 final release.</p>
      </div>
    </div>
  );
};
