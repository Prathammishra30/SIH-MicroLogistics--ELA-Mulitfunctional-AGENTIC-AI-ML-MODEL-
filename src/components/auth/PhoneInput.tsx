import React from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from "../../context/LanguageContext";

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
    const { t } = useLanguage();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(cleaned);
  };

  const isValid = value.length === 10;

  return (
    <div className="space-y-1.5 text-left w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {label}
        </label>
        {isValid && !error && (
          <span className="text-[11px] font-medium text-[#2E7D32] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {t('auth.common.valid_mobile_number')}</span>
        )}
      </div>

      <div className="relative flex items-center">
        {/* Country Code Prefix */}
        <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-gray-500 border-r border-gray-200 pr-2.5">
          <span className="text-sm" role="img" aria-label="India flag">
            🇮🇳
          </span>
          <span className="text-xs font-semibold text-gray-700">+91</span>
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
          className={`w-full pl-22 pr-10 py-2.5 rounded-xl bg-white border text-gray-900 placeholder-gray-400 text-sm font-medium tracking-wider transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-200'
              : isValid
              ? 'border-green-600 focus:ring-green-100'
              : 'border-gray-300 focus:border-gray-400 focus:ring-gray-100'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />

        {/* Right Status Icon */}
        <div className="absolute right-3.5 pointer-events-none text-gray-400">
          {error ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <Phone className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
