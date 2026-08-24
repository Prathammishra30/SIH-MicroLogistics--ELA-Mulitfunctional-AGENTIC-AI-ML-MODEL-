import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, FileCheck, ShieldCheck, Mail, Phone } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { PhoneInput } from '../../components/auth/PhoneInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { OTPInput } from '../../components/auth/OTPInput';
import { VerificationSuccess } from '../../components/auth/VerificationSuccess';
import { useSharedContext } from '../../context/SharedContext';

type AuthStep = 'login' | 'otp' | 'register' | 'success';
type LoginMethod = 'otp' | 'password';

export const TransporterAuth: React.FC = () => {
  const { login, register } = useSharedContext();
  const [step, setStep] = useState<AuthStep>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [phone, setPhone] = useState('9876543212');
  const [email, setEmail] = useState('transporter@ruralflow.in');
  const [password, setPassword] = useState('password123');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration form
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    password: '',
    vehicleType: 'Pickup (1.5 - 2.5 MT)',
    vehicleRegNo: '',
    capacity: '2.0 MT',
    operatingRegion: 'Western Maharashtra (Pune - Satara - Kolhapur)',
    ownership: 'Driver & Owner',
  });
  const [regError, setRegError] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginMethod === 'otp') {
      if (phone.length !== 10) {
        setPhoneError('Please enter a valid 10-digit mobile number');
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
        await login(email, password, 'TRANSPORTER');
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
        await login('transporter@ruralflow.in', 'password123', 'TRANSPORTER');
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

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (
      !regForm.fullName.trim() ||
      !regForm.vehicleRegNo.trim() ||
      !regForm.email.trim() ||
      !regForm.password
    ) {
      setRegError('Please fill all required details with vehicle registration');
      return;
    }

    if (regForm.password.length < 8) {
      setRegError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(
        {
          name: `${regForm.fullName.trim()} (${regForm.vehicleRegNo.trim()})`,
          email: regForm.email.trim(),
          password: regForm.password,
          role: 'TRANSPORTER',
          phone: phone || undefined,
        },
        'TRANSPORTER'
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
      roleName="Transporter"
      roleIcon={Truck}
      headline="Turn available vehicle capacity into smarter, more profitable trips."
      supportingText="Join the shared rural micro-logistics network to find aggregated loads, eliminate empty return journeys, and boost monthly vehicle earnings."
      benefits={[
        {
          title: 'Find load pooling orders',
          desc: 'Get matched with grouped smallholder consignments along your route.',
        },
        {
          title: 'Eliminate empty backhauls',
          desc: 'Pick up return freight automatically from APMCs and mandis.',
        },
        {
          title: 'Guaranteed trip payouts',
          desc: 'Instant milestone verification and direct electronic trip settlement.',
        },
      ]}
      accentColorHex="#0EA5E9"
      accentBorderClass="border-sky-500/30"
      accentBgClass="bg-sky-500/10"
      accentTextClass="text-sky-400"
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
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, Transporter
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Sign in to view nearby load boards, accept route dispatches, and track earnings.
              </p>
            </div>

            {/* Login Method Switcher: Mobile OTP vs Email & Password */}
            <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  loginMethod === 'password'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
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
                    ? 'bg-sky-500 text-slate-950 shadow-md'
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

            {/* Form based on selected login method */}
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
                      Transporter Email ID
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
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
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-sky-500 hover:bg-sky-400 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>{loginMethod === 'otp' ? 'Send OTP →' : 'Sign In as Transporter →'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              <span>Have a commercial vehicle? </span>
              <button
                type="button"
                onClick={() => {
                  setLoginError('');
                  setStep('register');
                }}
                className="font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors ml-1"
              >
                Register your vehicle
              </button>
            </div>
          </motion.div>
        )}

        {/* 2. OTP STEP */}
        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 text-left"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Verify Transporter Mobile
              </h2>
              <p className="text-xs text-slate-300">
                Enter the demo 6-digit code (<strong>123456</strong>) sent to your mobile.
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
              accentColor="#0EA5E9"
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
            className="space-y-4 text-left"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Register Transporter Vehicle
              </h2>
              <p className="text-xs text-slate-300">
                Onboard your pickup or commercial truck to the RuralFlow fleet.
              </p>
            </div>

            {regError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                {regError}
              </p>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Owner / Driver Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunil Deshmukh"
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={regForm.vehicleType}
                    onChange={(e) => setRegForm({ ...regForm, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="Pickup (1.5 - 2.5 MT)">Pickup (Bolero / Tata Yodha 1.5 - 2.5 MT)</option>
                    <option value="Small Commercial Vehicle (SCV)">SCV (Tata Ace / Dost 0.7 - 1.2 MT)</option>
                    <option value="Light Commercial Truck">LCV / Mini-Truck (3.5 - 5 MT)</option>
                    <option value="Tractor Trolley">Tractor Trolley (Agri-haul)</option>
                  </select>
                </div>
              </div>

              {/* Email & Password for Real Auth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Transporter Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="driver@example.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <PasswordInput
                    value={regForm.password}
                    onChange={(val) => setRegForm({ ...regForm, password: val })}
                    label="Password (min 8 chars) *"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Vehicle Reg Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH 12 AB 1234"
                    value={regForm.vehicleRegNo}
                    onChange={(e) => setRegForm({ ...regForm, vehicleRegNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm font-mono uppercase focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Pay Load Capacity
                  </label>
                  <input
                    type="text"
                    value={regForm.capacity}
                    onChange={(e) => setRegForm({ ...regForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <PhoneInput
                value={phone}
                onChange={(val) => setPhone(val)}
                label="Driver Mobile (Optional)"
              />

              {/* Visual Demo Vehicle Verification Section */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-sky-400" /> Vehicle Verification Preview
                  </span>
                  <span className="text-[10px] text-sky-400 font-medium px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                    Fast Track Demo
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 mx-auto mb-1" />
                    <span>RC Document</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 mx-auto mb-1" />
                    <span>Driving License</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 mx-auto mb-1" />
                    <span>Permit / Fitness</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-sky-500 hover:bg-sky-400 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 mt-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Registering Vehicle...</span>
                  </>
                ) : (
                  <>
                    <span>Create Transporter Account →</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400">
              <span>Already registered? </span>
              <button
                type="button"
                onClick={() => {
                  setRegError('');
                  setStep('login');
                }}
                className="font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors ml-1"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        )}

        {/* 4. SUCCESS STEP */}
        {step === 'success' && (
          <VerificationSuccess
            roleTitle="Transporter"
            dashboardRoute="/transporter/dashboard"
            accentColor="#0EA5E9"
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};
