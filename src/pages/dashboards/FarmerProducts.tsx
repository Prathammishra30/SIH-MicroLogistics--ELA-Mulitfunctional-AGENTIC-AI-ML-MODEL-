import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Plus, Sprout, Search, Truck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const FarmerProducts: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { state } = useSharedContext();
  const [searchQuery, setSearchQuery] = useState('');
  const shouldReduceMotion = useReducedMotion();

  const filteredProducts = state.products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            onClick={() => navigate('/farmer/dashboard')}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title={t('farmer.back_to_dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#2E7D32]" />
              {t('farmer.my_products')}
            </h1>
            <p className="text-xs text-gray-500">
              {t('farmer.manage_your_farm_produce_and_h')}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          onClick={() => navigate('/farmer/products/new')}
          className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('farmer.add_new_produce')}</span>
        </motion.button>
      </header>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('farmer.search_products_by_crop_name_o')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all shadow-2xs"
        />
      </div>

      {/* Product Cards Grid */}
      {state.products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.35,
                delay: shouldReduceMotion ? 0 : idx * 0.05,
              }}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -4, transition: { duration: 0.2 } }
              }
              className="p-5 rounded-2xl bg-white border border-gray-200/90 hover:border-green-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] border border-green-200 flex items-center justify-center text-[#2E7D32]">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <StatusBadge status={product.status} />
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-0.5">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {product.category} {t('farmer._grade')} {product.grade}
                </p>
                {product.harvestDate && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t('farmer.harvested')} {product.harvestDate}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {t('farmer.available_quantity')}
                  </span>
                  <span className="text-gray-900 font-bold font-mono">
                    {product.quantity}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{t('farmer.expected_rate')}</span>
                  <span className="text-[#2E7D32] font-semibold">
                    {t('farmer.direct_farm_gate')}
                  </span>
                </div>

                <motion.button
                  type="button"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() => navigate('/farmer/logistics')}
                  className="w-full py-2 px-3 rounded-xl bg-gray-50 hover:bg-green-50/80 border border-gray-200 hover:border-green-200 text-gray-700 hover:text-green-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t('farmer.book_transport')}</span>
                </motion.button>
              </div>
            </motion.div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-white">
              <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-xs font-medium">
                {t('farmer.no_produce_items_found_matchin')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#E8F5E9] border border-green-200 flex items-center justify-center text-[#2E7D32] mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">
              {t('farmer.no_produce_listed_yet')}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {t('farmer.start_by_listing_your_harveste')}
            </p>
          </div>
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            onClick={() => navigate('/farmer/products/new')}
            className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('farmer.list_your_first_crop')}</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};
