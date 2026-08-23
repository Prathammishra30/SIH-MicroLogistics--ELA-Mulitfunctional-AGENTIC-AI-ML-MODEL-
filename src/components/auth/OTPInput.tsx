import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  accentColor = '#10B981',
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
        <p className="text-xs text-slate-400">
          We sent a 6-digit verification code to
        </p>
        <div className="flex items-center justify-center gap-2">
          <strong className="text-sm font-bold text-white tracking-wide font-mono">
            {formattedPhone}
          </strong>
          <button
            type="button"
            onClick={onEditPhone}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
          >
            Change
          </button>
        </div>
      </div>

      {/* Demo helper pill */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Demo verification code: <strong className="font-mono text-amber-200">123456</strong></span>
      </div>

      {/* 6-box input container */}
      <motion.div
        animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center gap-2 sm:gap-3"
      >
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
            className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-lg sm:text-xl font-bold font-mono rounded-xl bg-slate-950/90 border text-white transition-all duration-200 focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-500/80 focus:ring-rose-500/30'
                : digit
                ? 'border-emerald-500/70 focus:ring-emerald-500/30'
                : 'border-slate-800 focus:border-slate-600 focus:ring-slate-700/30'
            } ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`Digit ${idx + 1}`}
          />
        ))}
      </motion.div>

      {/* Error text if invalid */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-rose-400 font-medium flex items-center justify-center gap-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </motion.p>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={() => onComplete(digits.join(''))}
        disabled={isVerifying || digits.includes('')}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-950 transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
          digits.includes('') || isVerifying
            ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
            : 'hover:opacity-90 active:scale-[0.99]'
        }`}
        style={{
          backgroundColor: digits.includes('') ? undefined : accentColor,
        }}
      >
        {isVerifying ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 px-1">
        <span>Didn't receive the code?</span>
        {countdown > 0 ? (
          <span className="font-mono text-slate-300 font-medium">
            Resend in {countdown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendClick}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
};
