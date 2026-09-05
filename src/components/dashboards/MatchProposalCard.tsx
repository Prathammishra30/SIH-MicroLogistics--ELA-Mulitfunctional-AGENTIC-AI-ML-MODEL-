import React, { useState } from 'react';
import { CheckCircle2, XCircle, Volume2, ShieldCheck, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useEla } from '../../context/ElaContext';

export interface MatchProposalData {
  id: string;
  farmerId: string;
  buyerId: string;
  transporterId: string;
  productId?: string;
  procurementRequestId?: string;
  vehicleId?: string;
  crop: string;
  quantityKg: number;
  askingPricePerKg: number;
  targetPricePerKg: number;
  transportCostPerKg: number;
  totalCostPerKg: number;
  matchScore: number;
  subScores: {
    price_fit?: number;
    timing_fit?: number;
    route_fit?: number;
    capacity_fit?: number;
    ml_utility?: number;
    transport_cost_per_kg?: number;
  };
  explanation: string;
  farmerStatus: 'PENDING' | 'APPROVED' | 'DECLINED';
  buyerStatus: 'PENDING' | 'APPROVED' | 'DECLINED';
  transporterStatus: 'PENDING' | 'APPROVED' | 'DECLINED';
  status: 'PROPOSED' | 'ALL_APPROVED' | 'DECLINED' | 'EXPIRED' | 'CONFIRMED';
  expiresAt: string;
  createdAt: string;
  farmer?: {
    village?: string;
    district?: string;
    state?: string;
    user?: { name?: string; phone?: string };
  };
  buyer?: {
    businessName?: string;
    location?: string;
  };
  transporter?: {
    fullName?: string;
    vehicleType?: string;
    user?: { name?: string; phone?: string };
  };
  vehicle?: {
    type?: string;
    registration?: string;
    capacity?: string;
  };
}

interface MatchProposalCardProps {
  proposal: MatchProposalData;
  currentRole: 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'ADMIN';
  onDecisionUpdated?: (updated: MatchProposalData) => void;
}

export const MatchProposalCard: React.FC<MatchProposalCardProps> = ({
  proposal,
  currentRole,
  onDecisionUpdated,
}) => {
  const { t } = useLanguage();
  const { speakResponse } = useEla();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const myStatus =
    currentRole === 'FARMER'
      ? proposal.farmerStatus
      : currentRole === 'BUYER'
      ? proposal.buyerStatus
      : currentRole === 'TRANSPORTER'
      ? proposal.transporterStatus
      : 'PENDING';

  const hasDecided = myStatus === 'APPROVED' || myStatus === 'DECLINED';
  const isTerminal =
    proposal.status === 'ALL_APPROVED' ||
    proposal.status === 'CONFIRMED' ||
    proposal.status === 'DECLINED' ||
    proposal.status === 'EXPIRED';

  const handleDecision = async (decision: 'APPROVED' | 'DECLINED') => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/ela/matches/${proposal.id}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: currentRole,
          decision,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.proposal) {
        if (onDecisionUpdated) {
          onDecisionUpdated(data.data.proposal);
        }
      } else {
        setErrorMsg(data.message || 'Failed to submit decision');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHearSummary = () => {
    speakResponse(proposal.explanation);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ALL_APPROVED':
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DECLINED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'EXPIRED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const scorePct = Math.round(proposal.matchScore * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {proposal.crop} • {proposal.quantityKg} kg
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('match.expiresIn')}: {new Date(proposal.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        </div>

        {/* Match Score Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">{t('match.score')}:</span>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{scorePct}%</span>
          </div>
        </div>
      </div>

      {/* Financial & Route Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/70 p-3 rounded-xl text-center">
        <div className="border-r border-slate-200/60 last:border-none px-2">
          <div className="text-[11px] text-slate-500">{t('match.askingPrice')}</div>
          <div className="text-sm font-bold text-slate-800 mt-0.5">₹{proposal.askingPricePerKg}/kg</div>
        </div>
        <div className="border-r border-slate-200/60 last:border-none px-2">
          <div className="text-[11px] text-slate-500">{t('match.transportCost')}</div>
          <div className="text-sm font-bold text-slate-800 mt-0.5">₹{proposal.transportCostPerKg}/kg</div>
        </div>
        <div className="border-r border-slate-200/60 last:border-none px-2">
          <div className="text-[11px] text-slate-500">{t('match.totalCost')}</div>
          <div className="text-sm font-bold text-emerald-600 mt-0.5">₹{proposal.totalCostPerKg}/kg</div>
        </div>
        <div className="px-2">
          <div className="text-[11px] text-slate-500">{t('match.targetPrice')}</div>
          <div className="text-sm font-bold text-blue-600 mt-0.5">₹{proposal.targetPricePerKg}/kg</div>
        </div>
      </div>

      {/* Sub-Scores Breakdown */}
      <div className="space-y-1.5">
        <div className="text-xs font-semibold text-slate-700">{t('match.subScores')}</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-2 text-center">
            <div className="text-slate-500 text-[10px]">{t('match.priceFit')}</div>
            <div className="font-semibold text-slate-700 mt-0.5">
              {Math.round((proposal.subScores.price_fit || 0) * 100)}%
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-2 text-center">
            <div className="text-slate-500 text-[10px]">{t('match.timingFit')}</div>
            <div className="font-semibold text-slate-700 mt-0.5">
              {Math.round((proposal.subScores.timing_fit || 0) * 100)}%
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-2 text-center">
            <div className="text-slate-500 text-[10px]">{t('match.routeFit')}</div>
            <div className="font-semibold text-slate-700 mt-0.5">
              {Math.round((proposal.subScores.route_fit || 0) * 100)}%
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-2 text-center">
            <div className="text-slate-500 text-[10px]">{t('match.capacityFit')}</div>
            <div className="font-semibold text-slate-700 mt-0.5">
              {Math.round((proposal.subScores.capacity_fit || 0) * 100)}%
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-2 text-center">
            <div className="text-slate-500 text-[10px]">{t('match.mlUtility')}</div>
            <div className="font-semibold text-slate-700 mt-0.5">
              {Math.round((proposal.subScores.ml_utility || 0) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Box + Voice Orb Trigger */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs text-slate-700 flex items-start justify-between gap-3">
        <p className="leading-relaxed flex-1">{proposal.explanation}</p>
        <button
          onClick={handleHearSummary}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition shadow-sm shrink-0"
          title={t('match.hearSummaryBtn')}
          aria-label={t('match.hearSummaryBtn')}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">{t('match.hearSummaryBtn')}</span>
        </button>
      </div>

      {/* 3-Party Consent Statuses */}
      <div className="border-t border-slate-100 pt-3 space-y-2">
        <div className="text-xs font-semibold text-slate-700">3-Party Governance Status</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${getStatusBadgeClass(proposal.farmerStatus)}`}>
            <span>{t('match.farmerStatus')}:</span>
            <span className="font-bold">{proposal.farmerStatus}</span>
          </div>
          <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${getStatusBadgeClass(proposal.buyerStatus)}`}>
            <span>{t('match.buyerStatus')}:</span>
            <span className="font-bold">{proposal.buyerStatus}</span>
          </div>
          <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${getStatusBadgeClass(proposal.transporterStatus)}`}>
            <span>{t('match.transporterStatus')}:</span>
            <span className="font-bold">{proposal.transporterStatus}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Actions */}
      {!hasDecided && !isTerminal && (
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={() => handleDecision('DECLINED')}
            disabled={submitting}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition flex items-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{submitting ? t('match.declining') : t('match.declineBtn')}</span>
          </button>
          <button
            onClick={() => handleDecision('APPROVED')}
            disabled={submitting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{submitting ? t('match.approving') : t('match.approveBtn')}</span>
          </button>
        </div>
      )}

      {/* Already Decided Banner */}
      {hasDecided && !isTerminal && (
        <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 text-xs border border-slate-200/60 text-center font-medium">
          {myStatus === 'APPROVED' ? t('match.approvedSuccess') : t('match.declinedSuccess')}
        </div>
      )}

      {/* Terminal State Banners */}
      {proposal.status === 'ALL_APPROVED' && (
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 text-center font-medium flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{t('match.statusAllApproved')}</span>
        </div>
      )}
      {proposal.status === 'CONFIRMED' && (
        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs border border-emerald-300 text-center font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>{t('match.confirmedSuccess')}</span>
        </div>
      )}
      {proposal.status === 'DECLINED' && (
        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 text-center font-medium flex items-center justify-center gap-1.5">
          <XCircle className="w-4 h-4 text-rose-600" />
          <span>{t('match.statusDeclined')}</span>
        </div>
      )}
    </div>
  );
};
