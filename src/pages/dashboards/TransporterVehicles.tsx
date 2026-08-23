import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gauge } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';

export const TransporterVehicles: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useSharedContext();
  
  const toggleStatus = (id: string, currentStatus: string) => {
    dispatch({
      type: 'UPDATE_VEHICLE_STATUS',
      payload: {
        id,
        status: currentStatus === 'Available' ? 'Busy' : 'Available'
      }
    });
  };

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
          <Gauge className="w-6 h-6 text-violet-400" />
          Vehicle Fleet Management
        </h1>
      </div>

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
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${vehicle.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
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
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
