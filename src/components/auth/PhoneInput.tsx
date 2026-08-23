import React from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  label = 'Mobile Number',
  placeholder = '98765 43210',
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only digits and max 10 chars
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(cleaned);
  };

  const isValid = value.length === 10;

  return (
    <div className="space-y-1.5 text-left w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        {isValid && !error && (
          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Valid mobile number
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        {/* Country Code Prefix */}
        <div className="absolute left-3.5 flex items-center gap-2 pointer-events-none text-slate-400 border-r border-slate-700/80 pr-2.5">
          <span className="text-sm" role="img" aria-label="India flag">
            🇮🇳
          </span>
          <span className="text-xs font-semibold text-slate-200">+91</span>
        </div>

        {/* Input */}
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-24 pr-10 py-3 rounded-xl bg-slate-950/80 border text-white placeholder-slate-500 text-sm font-medium tracking-wider transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500/30'
              : isValid
              ? 'border-emerald-500/60 focus:ring-emerald-500/30'
              : 'border-slate-800 focus:border-slate-600 focus:ring-slate-700/30'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />

        {/* Right Status Icon */}
        <div className="absolute right-3.5 pointer-events-none text-slate-400">
          {error ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <Phone className="w-4 h-4 text-slate-500" />
          )}
        </div>
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
