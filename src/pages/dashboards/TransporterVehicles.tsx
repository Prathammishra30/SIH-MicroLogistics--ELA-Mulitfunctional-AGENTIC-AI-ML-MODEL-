import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gauge, Plus, Truck, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { transporterApi } from '../../services/api';

export const TransporterVehicles: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useSharedContext();

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    registration: '',
    capacity: '',
  });

  const vehicleTypes = [
    'Tata Ace (Mini Truck)',
    'Bolero Pickup',
    'Eicher Pro 2049',
    'Medium Goods Carrier',
    'Large Goods Carrier',
    'Three Wheeler Cargo',
    'Tempo Traveller (Goods)',
  ];

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Available' ? 'Busy' : 'Available';
    try {
      await transporterApi.updateVehicle(id, { status: newStatus });
      dispatch({
        type: 'UPDATE_VEHICLE_STATUS',
        payload: { id, status: newStatus as 'Available' | 'Busy' },
      });
    } catch (err) {
      console.warn('Status toggle error:', err);
      dispatch({
        type: 'UPDATE_VEHICLE_STATUS',
        payload: { id, status: newStatus as 'Available' | 'Busy' },
      });
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const vehicle = await transporterApi.createVehicle({
        type: formData.type,
        registration: formData.registration.toUpperCase(),
        capacity: formData.capacity,
      });

      dispatch({
        type: 'ADD_VEHICLE',
        payload: {
          id: vehicle.id,
          type: vehicle.type,
          registration: vehicle.registration,
          capacity: vehicle.capacity,
          status: (vehicle.status as 'Available') || 'Available',
          utilization: vehicle.utilization || 0,
        },
      });

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Vehicle ${vehicle.registration} added successfully!`,
          type: 'success',
        },
      });

      setFormData({ type: '', registration: '', capacity: '' });
      setShowAddForm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add vehicle';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
      case 'Busy': return 'bg-amber-500/20 text-amber-400 border-amber-500/20';
      case 'Maintenance': return 'bg-rose-500/20 text-rose-400 border-rose-500/20';
      case 'Offline': return 'bg-slate-700/50 text-slate-400 border-slate-600';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen flex flex-col z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/transporter/dashboard')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Gauge className="w-6 h-6 text-violet-400" />
            Vehicle & Health Status
          </h1>
        </div>

        <button
          onClick={() => { setShowAddForm(!showAddForm); setError(null); }}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* Add Vehicle Form */}
      {showAddForm && (
        <div className="mb-6 p-6 rounded-2xl bg-slate-900/90 border border-violet-500/30 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-violet-400" />
            Register New Vehicle
          </h2>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleAddVehicle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Vehicle Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none"
              >
                <option value="">Select vehicle type...</option>
                {vehicleTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Registration Number *</label>
              <input
                type="text"
                value={formData.registration}
                onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                placeholder="e.g. MH 12 AB 1234"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Capacity *</label>
              <input
                type="text"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g. 750 kg or 2.5 MT"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !formData.type || !formData.registration || !formData.capacity}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center gap-2 transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSubmitting ? 'Registering...' : 'Register Vehicle'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setError(null); }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicle List */}
      {state.vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 rounded-2xl bg-slate-900/50 border border-dashed border-slate-700 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
            <Truck className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Vehicles Registered</h3>
            <p className="text-sm text-slate-400 mt-1">Add your first vehicle to start accepting logistics trips.</p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-violet-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Your First Vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.vehicles.map((vehicle) => (
            <div key={vehicle.id} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{vehicle.type}</h3>
                  <p className="text-sm text-slate-400 mt-1 font-mono">{vehicle.registration}</p>
                </div>
                <button
                  onClick={() => toggleStatus(vehicle.id, vehicle.status)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor(vehicle.status)}`}
                >
                  {vehicle.status}
                </button>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Capacity</span>
                  <span className="text-white font-semibold">{vehicle.capacity}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Utilization</span>
                  <span className="text-violet-400 font-semibold">{vehicle.utilization}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Health</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {vehicle.status === 'Maintenance' ? 'Under Maintenance' : 'Good'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
