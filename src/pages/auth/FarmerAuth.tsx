import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, ArrowRight, UserCheck } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { PhoneInput } from '../../components/auth/PhoneInput';
import { OTPInput } from '../../components/auth/OTPInput';
import { VerificationSuccess } from '../../components/auth/VerificationSuccess';

type AuthStep = 'login' | 'otp' | 'register' | 'success';

export const FarmerAuth: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const [phone, setPhone] = useState('9876543210');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration form fields
  const [formData, setFormData] = useState({
    fullName: '',
    village: '',
    district: '',
    state: 'Maharashtra',
    producerType: 'Farmer',
    category: 'Fresh Vegetables & Fruits',
    farmName: '',
  });
  const [regError, setRegError] = useState('');

  // Handle Send OTP
  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setPhoneError('');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp');
    }, 600);
  };

  // Handle OTP Verification
  const handleVerifyOTP = (enteredOtp: string) => {
    setIsSubmitting(true);
    setOtpError('');

    setTimeout(() => {
      setIsSubmitting(false);
      // Demo OTP is 123456
      if (enteredOtp === '123456') {
        setStep('success');
      } else {
        setOtpError('Invalid verification code. Please try again.');
      }
    }, 500);
  };

  // Handle Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.village.trim() || !formData.district.trim() || phone.length !== 10) {
      setRegError('Please complete all mandatory fields with a valid 10-digit number');
      return;
    }
    setRegError('');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp');
    }, 600);
  };

  return (
    <AuthLayout
      roleName="Farmer / Artisan"
      roleIcon={Sprout}
      headline="From your field to the right market."
      supportingText="Connect your produce with demand and move it efficiently through smarter rural logistics."
      benefits={[
        {
          title: 'Discover nearby demand',
          desc: 'Access live procurement orders from commercial buyers and APMCs.',
        },
        {
          title: 'Find efficient logistics',
          desc: 'Book shared capacity in rural mini-trucks and SCVs to cut transport costs.',
        },
        {
          title: 'Track your deliveries',
          desc: 'Receive real-time dispatch updates and direct DBT bank settlement.',
        },
      ]}
      accentColorHex="#10B981"
      accentBorderClass="border-emerald-500/30"
      accentBgClass="bg-emerald-500/10"
      accentTextClass="text-emerald-400"
    >
      <AnimatePresence mode="wait">
        
        {/* 1. LOGIN STEP (Mobile Number Entry) */}
        {step === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 text-left"
          >
            {/* Header & Toggle */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, Farmer
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Sign in to manage your produce, discover opportunities and coordinate your deliveries.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSendOTP} className="space-y-5">
              <PhoneInput
                value={phone}
                onChange={(val) => {
                  setPhone(val);
                  if (phoneError) setPhoneError('');
                }}
                error={phoneError}
                disabled={isSubmitting}
              />

              <button
                type="submit"
                disabled={isSubmitting || phone.length !== 10}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 ${
                  phone.length !== 10 || isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle to Register */}
            <div className="pt-2 text-center text-xs text-slate-400">
              <span>New to RuralFlow? </span>
              <button
                type="button"
                onClick={() => {
                  setPhoneError('');
                  setStep('register');
                }}
                className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors ml-1"
              >
                Create your account
              </button>
            </div>
          </motion.div>
        )}

        {/* 2. OTP VERIFICATION STEP */}
        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 text-left"
          >
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Verify your mobile number
              </h2>
              <p className="text-xs text-slate-300">
                Enter the verification code to authenticate your session.
              </p>
            </div>

            <OTPInput
              phoneNumber={phone}
              onComplete={handleVerifyOTP}
              error={otpError}
              isVerifying={isSubmitting}
              onResend={() => setOtpError('')}
              onEditPhone={() => {
                setOtpError('');
                setStep('login');
              }}
              accentColor="#10B981"
            />
          </motion.div>
        )}

        {/* 3. REGISTRATION STEP */}
        {step === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-5 text-left"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Create Farmer / Artisan Account
              </h2>
              <p className="text-xs text-slate-300">
                Join thousands of rural producers connecting directly with markets.
              </p>
            </div>

            {regError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                {regError}
              </p>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Patel"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Mobile Number */}
              <PhoneInput
                value={phone}
                onChange={(val) => setPhone(val)}
                label="Mobile Number (for OTP Login) *"
              />

              {/* Producer Type & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Role Type
                  </label>
                  <select
                    value={formData.producerType}
                    onChange={(e) => setFormData({ ...formData, producerType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Farmer">Farmer (Agricultural Producer)</option>
                    <option value="Artisan">Rural Artisan / Handcraft</option>
                    <option value="FPO">FPO / Cooperative Group</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Primary Product
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Fresh Vegetables & Fruits">Fresh Vegetables & Fruits</option>
                    <option value="Grains, Pulses & Cereals">Grains, Pulses & Cereals</option>
                    <option value="Spices & Commercial Crops">Spices & Commercial Crops</option>
                    <option value="Pottery & Handicrafts">Pottery & Handcrafts</option>
                    <option value="Dairy & Poultry">Dairy & Poultry</option>
                  </select>
                </div>
              </div>

              {/* Location: Village & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Village / Town *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shirwal"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Satara"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Optional Farm Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Farm / Enterprise Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Krishi Green Farms"
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Create Farmer Account →</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors ml-1"
              >
                Sign In with Mobile
              </button>
            </div>
          </motion.div>
        )}

        {/* 4. SUCCESS STEP */}
        {step === 'success' && (
          <VerificationSuccess
            roleTitle="Farmer"
            dashboardRoute="/farmer/dashboard"
            accentColor="#10B981"
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};
