import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLanguage } from "../../context/LanguageContext";

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
    const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 text-left w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[11px] text-gray-500">{t('auth.common.min_6_characters')}</span>
      </div>

      <div className="relative flex items-center">
        {/* Left Lock Icon */}
        <div className="absolute left-3.5 pointer-events-none text-gray-400">
          <Lock className="w-4 h-4" />
        </div>

        {/* Input */}
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-10 pr-11 py-2.5 rounded-xl bg-white border text-gray-900 placeholder-gray-400 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-100'
              : value.length >= 6
              ? 'border-green-600 focus:ring-green-100'
              : 'border-gray-300 focus:border-gray-400 focus:ring-gray-100'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />

        {/* Visibility Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors focus:outline-none cursor-pointer"
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
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
