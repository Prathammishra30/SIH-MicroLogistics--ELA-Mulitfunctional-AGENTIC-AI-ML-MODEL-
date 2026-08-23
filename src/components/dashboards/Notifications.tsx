import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSharedContext } from '../../context/SharedContext';
import { X, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

export const Notifications: React.FC = () => {
  const { state, dispatch } = useSharedContext();
  const activeNotifications = state.notifications.filter(n => !n.read);

  useEffect(() => {
    // Auto-dismiss notifications after 5 seconds
    activeNotifications.forEach(notification => {
      const timer = setTimeout(() => {
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notification.id });
      }, 5000);
      return () => clearTimeout(timer);
    });
  }, [activeNotifications, dispatch]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {activeNotifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg min-w-[300px] max-w-[400px] bg-slate-900 ${
              notification.type === 'success' ? 'border-emerald-500/50 text-emerald-100' :
              notification.type === 'error' ? 'border-rose-500/50 text-rose-100' :
              notification.type === 'warning' ? 'border-amber-500/50 text-amber-100' :
              'border-sky-500/50 text-sky-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
              {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {notification.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
            </div>
            <div className="flex-1 text-sm">{notification.message}</div>
            <button
              onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notification.id })}
              className="shrink-0 text-slate-400 hover:text-white transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
