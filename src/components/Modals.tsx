import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Route, HelpCircle, Phone, Mail, MapPin, Sparkles, Sprout, Truck, Store } from 'lucide-react';
import type { ModalType } from '../types';

interface ModalsProps {
  activeModal: ModalType;
  onClose: () => void;
}

export const Modals: React.FC<ModalsProps> = ({ activeModal, onClose }) => {
  return (
    <AnimatePresence>
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-all"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900/95 border border-slate-700/60 shadow-2xl p-6 sm:p-8 text-slate-100 z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X className="w-5 h-5" />
            </button>

            {/* HOW IT WORKS MODAL */}
            {activeModal === 'how-it-works' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Route className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">How RuralFlow Works</h3>
                    <p className="text-xs text-emerald-400 font-medium">Smart Micro-Logistics Engine</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  RuralFlow solves the last-mile logistical disconnect by uniting rural producers, local vehicle owners, and high-demand commercial buyers into an automated, shared-load distribution network.
                </p>

                <div className="grid gap-4 pt-2">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">1. Produce & Demand Aggregation</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Farmers and artisan clusters post available produce batches and dispatch readiness. Nearby buyers broadcast live procurement orders.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">2. Shared-Load Route Optimization</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Our spatial clustering algorithms pool smallholder loads into unified multi-stop routes, eliminating empty return trips and slashing transport costs by up to 35%.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400 shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">3. Guaranteed Fair Settlement</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Verified delivery milestones ensure immediate payments directly to producer bank accounts without predatory intermediate broker markups.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs hover:bg-emerald-400 transition-colors"
                  >
                    Got It, Continue to Roles
                  </button>
                </div>
              </div>
            )}

            {/* ABOUT MODAL */}
            {activeModal === 'about' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">About RuralFlow</h3>
                    <p className="text-xs text-sky-400 font-medium">Smart India Hackathon Initiative</p>
                  </div>
                </div>

                <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
                  <p>
                    In India, over <strong className="text-white">60% of smallholder farmers and rural artisans</strong> struggle to access fair urban markets due to fragmented logistics, high per-unit transport tariffs, and reliance on unorganized middlemen.
                  </p>
                  <p>
                    Simultaneously, thousands of rural small commercial vehicles (SCVs) run empty on return trips or operate at partial capacity.
                  </p>
                  <p className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 text-emerald-300 font-medium text-xs">
                    RuralFlow bridges this gap through localized micro-hubs, dynamic vehicle pooling, and fair market linkages.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <span className="text-xs text-slate-400 block">Mission</span>
                    <span className="text-sm font-semibold text-white mt-1 block">Empower 10M+ Rural Producers</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <span className="text-xs text-slate-400 block">Focus</span>
                    <span className="text-sm font-semibold text-white mt-1 block">Cost & Food Spoilage Reduction</span>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-semibold text-xs hover:bg-sky-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* CONTACT MODAL */}
            {activeModal === 'contact' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Support & Assistance</h3>
                    <p className="text-xs text-violet-400 font-medium">24x7 Rural Helpdesk</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Need help choosing a role, registering a vehicle, or joining as a cooperative? Our regional field officers and support team are available in 7 regional languages.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">Toll-Free Kisan & Transporter Helpline</span>
                      <strong className="text-white text-sm">1800-889-FLOW (3569)</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs">
                    <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">Project & Hackathon Inquiries</span>
                      <strong className="text-white text-sm">support@ruralflow.sih.org.in</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs">
                    <MapPin className="w-4 h-4 text-violet-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">Hub Network</span>
                      <span className="text-slate-200">Covering Tier-2, Tier-3 & Rural Cluster Hubs</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-violet-500 text-white font-semibold text-xs hover:bg-violet-400 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
