import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Truck, CheckCircle2, Loader2, X, Car } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { transporterApi } from '../../services/api';

export const TransporterVehicles: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useSharedContext();

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'Bolero Pickup',
    registration: '',
    capacity: '2.0 MT',
  });

  const vehicleTypes = [
    'Bolero Pickup',
    'Tata Ace (Mini Truck)',
    'Eicher Pro 2049',
    'Medium Goods Carrier',
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
    } catch {
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
          message: `Vehicle ${vehicle.registration} registered successfully.`,
          type: 'success',
        },
      });

      setFormData({ type: 'Bolero Pickup', registration: '', capacity: '2.0 MT' });
      setShowAddForm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add vehicle';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/transporter/dashboard')}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-700" />
              Vehicle Fleet & Health Status
            </h1>
            <p className="text-xs text-gray-500">
              Manage your commercial vehicle registrations, payload capacity, and health inspections.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Vehicle</span>
        </button>
      </header>

      {/* Vehicles Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Registered Fleet</h2>
            <p className="text-xs text-gray-500">Active transport vehicles validated for rural load dispatch</p>
          </div>
          <span className="text-xs font-bold text-gray-500">
            {state.vehicles.length} {state.vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
          </span>
        </div>

        {state.vehicles.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50 space-y-3">
            <Truck className="w-10 h-10 text-gray-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900">No Vehicles Registered</h3>
              <p className="text-xs text-gray-500">Add your first vehicle to start accepting crop logistics loads.</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Vehicle</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px] bg-gray-50/50">
                  <th className="py-2.5 px-3">Vehicle Type</th>
                  <th className="py-2.5 px-3">Registration Number</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Health</th>
                  <th className="py-2.5 px-3">Current Assignment</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.vehicles.map((v) => {
                  const assignedShipment = state.logisticsRequests.find(
                    (r) => (r.status === 'Assigned' || r.status === 'In Transit') && (r.vehicle?.includes(v.registration) || r.vehicle?.includes(v.type))
                  );

                  return (
                    <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-gray-900">{v.type}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                        {v.registration}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-gray-600">
                        {v.capacity}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            v.status === 'Available'
                              ? 'bg-[#E8F5E9] text-[#2E7D32] border-green-200'
                              : v.status === 'Busy'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E7D32]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Good (98%)</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-600">
                        {assignedShipment ? (
                          <div className="truncate max-w-[150px]">
                            <span className="font-semibold text-gray-900">#{assignedShipment.id}</span> • {assignedShipment.productName}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No active trip</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => toggleStatus(v.id, v.status)}
                          className="px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Toggle {v.status === 'Available' ? 'Busy' : 'Available'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Register Fleet Vehicle</h3>
                <p className="text-xs text-gray-500">Enter commercial vehicle details for capacity validation.</p>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Vehicle Model / Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-amber-600 focus:ring-2 focus:ring-amber-100 outline-none"
                >
                  {vehicleTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Registration Number (Plate) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.registration}
                  onChange={(e) => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
                  placeholder="e.g. MH-12-PQ-8890"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs font-mono focus:border-amber-600 focus:ring-2 focus:ring-amber-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rated Payload Capacity *
                </label>
                <input
                  type="text"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g. 2.0 MT, 1500 kg, 750 kg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-xs focus:border-amber-600 focus:ring-2 focus:ring-amber-100 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Register Vehicle</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
