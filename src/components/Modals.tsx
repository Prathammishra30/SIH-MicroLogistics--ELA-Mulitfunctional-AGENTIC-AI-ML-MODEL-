import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Route, HelpCircle, Phone, Mail, MapPin, Sprout, Truck, Store } from 'lucide-react';
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-all"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-gray-200 shadow-xl p-6 sm:p-8 text-gray-900 z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* HOW IT WORKS MODAL */}
            {activeModal === 'how-it-works' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-green-200 flex items-center justify-center text-[#2E7D32]">
                    <Route className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">How RuralFlow Works</h3>
                    <p className="text-xs text-[#2E7D32] font-semibold">Rural Micro-Logistics Engine</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  RuralFlow solves the rural freight disconnect by uniting farmers, local vehicle transporters, and buyers into an automated, shared-load distribution network.
                </p>

                <div className="grid gap-3 pt-1">
                  <div className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="p-2 rounded-lg bg-[#E8F5E9] text-[#2E7D32] shrink-0">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">1. Produce & Demand Aggregation</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Farmers post harvested crops and quantity ready for dispatch. Regional commercial buyers broadcast live procurement targets.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-800 shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">2. Capacity-Matched Route Optimization</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Transporters accept nearby loads with automated vehicle capacity validation, reducing empty return trips and lowering transport overhead.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">3. Direct Payment & Verified Handover</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Verified delivery milestones ensure immediate payments directly to producer bank accounts without predatory intermediate broker markups.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Got It
                  </button>
                </div>
              </div>
            )}

            {/* ABOUT MODAL */}
            {activeModal === 'about' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-green-200 flex items-center justify-center text-[#2E7D32]">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">About RuralFlow</h3>
                    <p className="text-xs text-gray-500 font-medium">Smart India Hackathon Initiative</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                  <p>
                    RuralFlow was engineered to modernize India's fragmented rural agricultural supply chain. Smallholder farmers often struggle with high last-mile freight costs and lack direct access to wholesale buyers.
                  </p>
                  <p>
                    By introducing vehicle capacity matching, transparent regional market pricing, and multi-user authentication, RuralFlow connects rural producers directly with the broader commercial economy.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-900">Architecture</div>
                    <div className="text-[11px] text-gray-500">React + TypeScript + Express + PostgreSQL + Prisma</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-green-200">
                    Production Ready
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
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
                  <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-green-200 flex items-center justify-center text-[#2E7D32]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Contact & Helpline</h3>
                    <p className="text-xs text-gray-500 font-medium">Farmer & Transporter Support</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                    <Phone className="w-4 h-4 text-[#2E7D32]" />
                    <div>
                      <div className="text-xs font-bold text-gray-900">Toll-Free Kisan Helpline</div>
                      <div className="text-xs text-gray-600">1800-RURAL-FLOW (1800-787-253)</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                    <Mail className="w-4 h-4 text-blue-700" />
                    <div>
                      <div className="text-xs font-bold text-gray-900">Technical Support Email</div>
                      <div className="text-xs text-gray-600">support@ruralflow.in</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                    <MapPin className="w-4 h-4 text-amber-700" />
                    <div>
                      <div className="text-xs font-bold text-gray-900">Rural Operations Hub</div>
                      <div className="text-xs text-gray-600">Smart India Hackathon • Pune Agritech Cluster</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Close
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
