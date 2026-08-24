import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSharedContext } from '../../context/SharedContext';
import { X, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

export const Notifications: React.FC = () => {
  const { state, dispatch } = useSharedContext();
  const activeNotifications = state.notifications.filter((n) => !n.read);

  useEffect(() => {
    // Auto-dismiss notifications after 5 seconds
    activeNotifications.forEach((notification) => {
      const timer = setTimeout(() => {
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notification.id });
      }, 5000);
      return () => clearTimeout(timer);
    });
  }, [activeNotifications, dispatch]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5">
      <AnimatePresence>
        {activeNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-lg min-w-[280px] max-w-[380px] bg-white ${
              notification.type === 'success'
                ? 'border-green-200 text-green-900 bg-green-50/50'
                : notification.type === 'error'
                ? 'border-red-200 text-red-900 bg-red-50/50'
                : notification.type === 'warning'
                ? 'border-amber-200 text-amber-900 bg-amber-50/50'
                : 'border-blue-200 text-blue-900 bg-blue-50/50'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {notification.type === 'success' && (
                <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
              )}
              {notification.type === 'error' && (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              {notification.type === 'warning' && (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              {notification.type === 'info' && (
                <Info className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 text-xs font-medium leading-snug">
              {notification.message}
            </div>
            <button
              onClick={() =>
                dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notification.id })
              }
              className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
