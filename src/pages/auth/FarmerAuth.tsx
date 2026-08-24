import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, ArrowRight, Phone, Mail } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { PhoneInput } from '../../components/auth/PhoneInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { OTPInput } from '../../components/auth/OTPInput';
import { VerificationSuccess } from '../../components/auth/VerificationSuccess';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';

type AuthStep = 'login' | 'otp' | 'register' | 'success';
type LoginMethod = 'otp' | 'password';

export const FarmerAuth: React.FC = () => {
  const { login, register } = useSharedContext();
  const { t } = useLanguage();
  const [step, setStep] = useState<AuthStep>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [phone, setPhone] = useState('9876543210');
  const [email, setEmail] = useState('farmer@ruralflow.in');
  const [password, setPassword] = useState('password123');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration form fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    village: '',
    district: '',
    state: 'Maharashtra',
    producerType: 'Farmer',
    category: 'Fresh Vegetables & Fruits',
    farmName: '',
  });
  const [regError, setRegError] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginMethod === 'otp') {
      if (phone.length !== 10) {
        setPhoneError('Please enter a valid 10-digit Indian mobile number');
        return;
      }
      setPhoneError('');
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setStep('otp');
      }, 500);
    } else {
      if (!email.includes('@')) {
        setEmailError('Please enter a valid email address');
        return;
      }
      if (password.length < 6) {
        setLoginError('Password must be at least 6 characters');
        return;
      }

      setIsSubmitting(true);
      try {
        await login(email, password, 'FARMER');
        setStep('success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid email or password';
        setLoginError(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle OTP Verification (Demo Fallback)
  const handleVerifyOTP = async (enteredOtp: string) => {
    setIsSubmitting(true);
    setOtpError('');

    if (enteredOtp === '123456') {
      try {
        await login('farmer@ruralflow.in', 'password123', 'FARMER');
        setStep('success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Authentication failed';
        setOtpError(msg);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
      setOtpError('Invalid verification code. Use demo code: 123456');
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.village.trim() ||
      !formData.district.trim()
    ) {
      setRegError('Please complete all mandatory fields');
      return;
    }

    if (formData.password.length < 8) {
      setRegError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(
        {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: 'FARMER',
          phone: undefined, // Fix: Do not send hardcoded OTP phone state during email registration to prevent unique constraint 409 error
          village: formData.village.trim(),
          district: formData.district.trim(),
          state: formData.state,
          producerType: formData.producerType,
          category: formData.category,
          farmName: formData.farmName.trim() || undefined,
        },
        'FARMER'
      );
      setStep('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setRegError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      roleName={t('gateway.role.farmer.badge') || "Farmer"}
      roleIcon={Sprout}
      headline={t('auth.farmer.title') || "From your field to the right market."}
      supportingText={t('auth.farmer.subtitle') || "Connect your produce with demand and move it efficiently through smarter rural logistics."}
      benefits={[
        {
          title: 'Discover nearby demand',
          desc: 'Access live procurement orders from commercial buyers and APMCs.',
        },
        {
          title: 'Find efficient logistics',
          desc: 'Book shared capacity in rural mini-trucks to cut transport costs.',
        },
        {
          title: 'Track your deliveries',
          desc: 'Receive real-time dispatch updates and direct payment settlement.',
        },
      ]}
      accentColorHex="#2E7D32"
      accentBorderClass="border-green-200"
      accentBgClass="bg-[#E8F5E9]"
      accentTextClass="text-[#2E7D32]"
      imageUrl="/images/farmer-seedling.jpg"
      imageAlt="Indian farmer inspecting field"
    >
      <AnimatePresence mode="wait">
        {/* 1. LOGIN STEP */}
        {step === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-5 text-left"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {t('auth.farmer.title') || 'Farmer Sign In'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {t('auth.farmer.subtitle') || 'Sign in to manage produce listings, request transport, and track deliveries.'}
              </p>
            </div>

            {/* Login Method Switcher */}
            <div className="flex p-1 rounded-xl bg-gray-100 border border-gray-200">
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  loginMethod === 'password'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email & Password</span>
              </button>

              <button
                type="button"
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  loginMethod === 'otp'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Mobile OTP</span>
              </button>
            </div>

            {loginError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg font-medium">
                {loginError}
              </p>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginMethod === 'otp' ? (
                <PhoneInput
                  value={phone}
                  onChange={(val) => {
                    setPhone(val);
                    if (phoneError) setPhoneError('');
                  }}
                  error={phoneError}
                  disabled={isSubmitting}
                />
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Farmer Email ID
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      disabled={isSubmitting}
                      placeholder="farmer@ruralflow.in"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-600"
                    />
                    {emailError && (
                      <p className="text-xs text-red-600 mt-1">{emailError}</p>
                    )}
                  </div>

                  <PasswordInput
                    value={password}
                    onChange={(val) => setPassword(val)}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#2E7D32] hover:bg-[#256628] transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Continue to Farmer Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Register */}
            <div className="pt-2 text-center text-xs text-gray-600">
              <span>New producer on RuralFlow? </span>
              <button
                type="button"
                onClick={() => setStep('register')}
                className="text-[#2E7D32] hover:underline font-bold cursor-pointer"
              >
                Register as Farmer
              </button>
            </div>
          </motion.div>
        )}

        {/* 2. OTP STEP */}
        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
          >
            <OTPInput
              phoneNumber={phone}
              onComplete={handleVerifyOTP}
              error={otpError}
              isVerifying={isSubmitting}
              onResend={() => handleVerifyOTP('123456')}
              onEditPhone={() => setStep('login')}
              accentColor="#2E7D32"
            />
          </motion.div>
        )}

        {/* 3. REGISTER STEP */}
        {step === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4 text-left"
          >
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Farmer Registration
              </h2>
              <p className="text-xs text-gray-600">
                Create your producer profile to list crops and request transport.
              </p>
            </div>

            {regError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg font-medium">
                {regError}
              </p>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Farm / Enterprise Name
                  </label>
                  <input
                    type="text"
                    value={formData.farmName}
                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                    placeholder="e.g. Patil Organic Farms"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@gmail.com"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Password (min 8 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Village / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder="e.g. Baramati"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-green-600 focus:outline-none"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#2E7D32] hover:bg-[#256628] transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-gray-600">
              <span>Already registered? </span>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="text-[#2E7D32] hover:underline font-bold cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        )}

        {/* 4. SUCCESS STEP */}
        {step === 'success' && (
          <VerificationSuccess
            roleTitle="Farmer Partner"
            dashboardRoute="/farmer/dashboard"
            accentColor="#2E7D32"
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};
