import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, ArrowRight, UserCheck, Phone, Mail } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { PhoneInput } from '../../components/auth/PhoneInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { OTPInput } from '../../components/auth/OTPInput';
import { VerificationSuccess } from '../../components/auth/VerificationSuccess';
import { useSharedContext } from '../../context/SharedContext';

type AuthStep = 'login' | 'otp' | 'register' | 'success';
type LoginMethod = 'otp' | 'password';

export const FarmerAuth: React.FC = () => {
  const { login, register } = useSharedContext();
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
        // Authenticate with seeded farmer account for demo OTP flow
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
          phone: phone || undefined,
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
        {/* 1. LOGIN STEP */}
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

            {/* Login Method Switcher */}
            <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  loginMethod === 'password'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email & Password</span>
              </button>

              <button
                type="button"
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  loginMethod === 'otp'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Mobile OTP</span>
              </button>
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
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
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                    />
                    {emailError && <p className="text-xs text-rose-400 mt-1">{emailError}</p>}
                  </div>

                  <PasswordInput
                    value={password}
                    onChange={(val) => setPassword(val)}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>{loginMethod === 'otp' ? 'Send OTP →' : 'Sign In as Farmer →'}</span>
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
                  setLoginError('');
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
                Enter the demo verification code (<strong>123456</strong>) to authenticate.
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

              {/* Email & Password for Real Auth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="farmer@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <PasswordInput
                    value={formData.password}
                    onChange={(val) => setFormData({ ...formData, password: val })}
                    label="Password (min 8 chars) *"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <PhoneInput
                value={phone}
                onChange={(val) => setPhone(val)}
                label="Mobile Number (Optional)"
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
                onClick={() => {
                  setRegError('');
                  setStep('login');
                }}
                className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors ml-1"
              >
                Sign In
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
