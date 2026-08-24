import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle, RotateCcw, KeyRound, Sparkles } from 'lucide-react';

interface OTPInputProps {
  phoneNumber: string;
  onComplete: (otp: string) => void;
  error?: string;
  isVerifying?: boolean;
  onResend: () => void;
  onEditPhone: () => void;
  accentColor?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  phoneNumber,
  onComplete,
  error,
  isVerifying = false,
  onResend,
  onEditPhone,
  accentColor = '#2E7D32',
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    const char = numeric.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto-advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-trigger completion if all filled
    const fullOtp = newDigits.join('');
    if (fullOtp.length === 6 && !newDigits.includes('')) {
      onComplete(fullOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);

    const nextFocusIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextFocusIdx]?.focus();

    if (pasted.length === 6) {
      onComplete(pasted);
    }
  };

  const handleResendClick = () => {
    if (countdown > 0) return;
    setCountdown(30);
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    onResend();
  };

  const formattedPhone = phoneNumber
    ? `+91 ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`
    : '+91 XXXXX XXXXX';

  return (
    <div className="space-y-6 text-center w-full">
      
      {/* Phone Destination Info */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500">
          We sent a 6-digit verification code to
        </p>
        <div className="flex items-center justify-center gap-2">
          <strong className="text-sm font-bold text-gray-900 tracking-wide font-mono">
            {formattedPhone}
          </strong>
          <button
            type="button"
            onClick={onEditPhone}
            className="text-xs font-semibold text-[#2E7D32] hover:underline cursor-pointer"
          >
            Change
          </button>
        </div>
      </div>

      {/* Demo helper pill */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        <span>Demo code: <strong className="font-mono text-amber-900">123456</strong></span>
      </div>

      {/* 6-box input container */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            disabled={isVerifying}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-xl bg-white border text-gray-900 transition-all focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-500 focus:ring-red-100'
                : digit
                ? 'border-green-600 focus:ring-green-100'
                : 'border-gray-300 focus:border-gray-400 focus:ring-gray-100'
            } ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`Digit ${idx + 1}`}
          />
        ))}
      </div>

      {/* Error text if invalid */}
      {error && (
        <p className="text-xs text-red-600 font-medium flex items-center justify-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={() => onComplete(digits.join(''))}
        disabled={isVerifying || digits.includes('')}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer ${
          digits.includes('') || isVerifying
            ? 'opacity-50 cursor-not-allowed bg-gray-400'
            : 'hover:opacity-90'
        }`}
        style={{
          backgroundColor: digits.includes('') ? undefined : accentColor,
        }}
      >
        {isVerifying ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Verifying Code...</span>
          </>
        ) : (
          <>
            <KeyRound className="w-4 h-4" />
            <span>Verify & Continue →</span>
          </>
        )}
      </button>

      {/* Resend OTP Row with Countdown */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 px-1">
        <span>Didn't receive the code?</span>
        {countdown > 0 ? (
          <span className="font-mono text-gray-600 font-medium">
            Resend in {countdown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendClick}
            className="flex items-center gap-1 text-[#2E7D32] hover:text-[#256628] font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
};
