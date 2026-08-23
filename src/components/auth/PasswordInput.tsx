import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  error,
  label = 'Password',
  placeholder = '••••••••',
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 text-left w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[11px] text-slate-400">Min 6 characters</span>
      </div>

      <div className="relative flex items-center">
        {/* Left Lock Icon */}
        <div className="absolute left-3.5 pointer-events-none text-slate-500">
          <Lock className="w-4 h-4" />
        </div>

        {/* Input */}
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/80 border text-white placeholder-slate-500 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500/30'
              : value.length >= 6
              ? 'border-emerald-500/60 focus:ring-emerald-500/30'
              : 'border-slate-800 focus:border-slate-600 focus:ring-slate-700/30'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />

        {/* Visibility Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors focus:outline-none"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
