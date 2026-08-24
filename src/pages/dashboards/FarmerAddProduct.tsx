import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, PackagePlus } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { farmerApi } from '../../services/api';
import type { Product } from '../../data/mockData';

export const FarmerAddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useSharedContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Vegetables',
    grade: 'Premium',
    quantity: '',
    harvestDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let newProduct: Product;
      try {
        const created = await farmerApi.addProduct(formData);
        newProduct = {
          id: created.id,
          name: created.name,
          category: created.category,
          quantity: created.quantity,
          grade: created.grade,
          harvestDate: created.harvestDate,
          status: 'Available',
        };
      } catch {
        newProduct = {
          id: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
          name: formData.name,
          category: formData.category,
          quantity: formData.quantity,
          grade: formData.grade,
          harvestDate: formData.harvestDate,
          status: 'Available',
        };
      }

      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { message: `Your ${formData.name} listing has been published.`, type: 'success' },
      });

      navigate('/farmer/products');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          onClick={() => navigate('/farmer/products')}
          className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-[#2E7D32]" />
            Add New Produce
          </h1>
          <p className="text-xs text-gray-500">List your harvest batch to make it discoverable for buyers.</p>
        </div>
      </header>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Produce / Crop Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Alphonso Mangoes, Organic Tomatoes, Basmati Rice"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Grains & Cereals">Grains & Cereals</option>
                <option value="Pulses & Legumes">Pulses & Legumes</option>
                <option value="Spices & Herbs">Spices & Herbs</option>
                <option value="Dairy & Farm Goods">Dairy & Farm Goods</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Quality Grade
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
              >
                <option value="Premium">Grade A (Premium Export Quality)</option>
                <option value="Standard">Grade B (Standard Market Quality)</option>
                <option value="Commercial">Grade C (Processing / Mandi Grade)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Total Quantity Available *
              </label>
              <input
                type="text"
                name="quantity"
                required
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g. 500 kg, 2 MT, 50 Crates"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Harvest / Ready Date *
              </label>
              <input
                type="date"
                name="harvestDate"
                required
                value={formData.harvestDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/farmer/products')}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Listing...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publish Produce Listing</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
