import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, ShoppingCart, Package } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const BuyerProduceMarket: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSharedContext();

  const availableProducts = state.products.filter((p) => p.status === 'Available');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/buyer/dashboard')}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-[#2E7D32]" />
              Available Farm Produce Catalog
            </h1>
            <p className="text-xs text-gray-500">
              Direct producer listings ready for bulk commercial procurement.
            </p>
          </div>
        </div>
      </header>

      {/* Produce Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {availableProducts.map((product) => (
          <div
            key={product.id}
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-2xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">{product.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-green-200">
                  Grade {product.grade}
                </span>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Available Volume:</span>
                  <strong className="text-gray-900 font-mono">{product.quantity}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span className="text-gray-900 font-medium">{product.category}</span>
                </div>
                {product.harvestDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Harvest Date:</span>
                    <span className="text-gray-700">{product.harvestDate}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() =>
                navigate('/buyer/procurement', {
                  state: { product: product.name, quantity: product.quantity },
                })
              }
              className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Procure This Produce</span>
            </button>
          </div>
        ))}

        {availableProducts.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
            <Package className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-600 text-xs font-medium">No produce currently listed by connected farmers.</p>
          </div>
        )}
      </div>
    </div>
  );
};
