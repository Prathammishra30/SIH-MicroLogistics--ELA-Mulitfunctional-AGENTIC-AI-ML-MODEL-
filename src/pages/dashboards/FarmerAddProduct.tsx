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
      // 1. Try persisting to PostgreSQL backend
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
        // Fallback for offline demo mode
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full relative z-10">
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/farmer/products')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-emerald-400" />
            Add New Product
          </h1>
          <p className="text-sm text-slate-400">Enter details of your new harvest or produce batch.</p>
        </div>
      </header>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Product Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Organic Tomatoes"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors appearance-none"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Grains">Grains</option>
                <option value="Spices">Spices</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Grade / Quality</label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors appearance-none"
              >
                <option value="Premium">Premium / Grade A</option>
                <option value="Standard">Standard / Grade B</option>
                <option value="Processing">Processing Grade</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Quantity (with Unit)</label>
              <input
                type="text"
                name="quantity"
                required
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g., 2.5 MT or 500 Kg"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Harvest Date</label>
              <input
                type="date"
                name="harvestDate"
                required
                value={formData.harvestDate}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/farmer/products')}
            className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 min-w-[140px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
