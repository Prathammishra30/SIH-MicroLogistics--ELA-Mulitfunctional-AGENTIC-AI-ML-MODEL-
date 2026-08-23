import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Building2, Phone, Mail, FileBadge } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { PhoneInput } from '../../components/auth/PhoneInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { OTPInput } from '../../components/auth/OTPInput';
import { VerificationSuccess } from '../../components/auth/VerificationSuccess';

type AuthStep = 'login' | 'otp' | 'register' | 'success';
type LoginMethod = 'otp' | 'password';

export const BuyerAuth: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('otp');
  const [phone, setPhone] = useState('9876543210');
  const [email, setEmail] = useState('buyer@apmcmarket.in');
  const [password, setPassword] = useState('password123');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Form
  const [regForm, setRegForm] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    location: 'Navi Mumbai APMC Mandi',
    businessType: 'APMC Licensed Commission Agent & Trader',
    gstin: '',
  });
  const [regError, setRegError] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      }, 600);
    } else {
      if (!email.includes('@')) {
        setEmailError('Please enter a valid business email');
        return;
      }
      if (password.length < 6) {
        return;
      }
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setStep('success');
      }, 600);
    }
  };

  // Handle OTP Verification
  const handleVerifyOTP = (enteredOtp: string) => {
    setIsSubmitting(true);
    setOtpError('');
    setTimeout(() => {
      setIsSubmitting(false);
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
    if (!regForm.businessName || !regForm.contactPerson || phone.length !== 10) {
      setRegError('Please complete all required fields with a valid mobile number');
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
      roleName="Buyer / Market"
      roleIcon={Store}
      headline="Source reliable produce and connect directly with verified producers."
      supportingText="Broadcast your procurement requirements, discover fresh farm-gate clusters, and monitor automated shared-logistics deliveries."
      benefits={[
        {
          title: 'Direct farm-gate procurement',
          desc: 'Access verified produce batches from certified farmer producer groups.',
        },
        {
          title: 'Quality-graded batches',
          desc: 'Inspect origin reports, grading standards, and batch harvest timestamps.',
        },
        {
          title: 'Transparent logistics tracking',
          desc: 'Monitor incoming consignments with live vehicle ETAs and digital receipts.',
        },
      ]}
      accentColorHex="#8B5CF6"
      accentBorderClass="border-violet-500/30"
      accentBgClass="bg-violet-500/10"
      accentTextClass="text-violet-400"
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
                Welcome, Buyer / Market
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Sign in to post procurement demand, bid on produce lots, and schedule intake.
              </p>
            </div>

            {/* Login Method Toggle */}
            <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  loginMethod === 'otp'
                    ? 'bg-violet-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Mobile OTP</span>
              </button>

              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  loginMethod === 'password'
                    ? 'bg-violet-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email & Password</span>
              </button>
            </div>

            {/* Form */}
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
                      Business Email ID
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500"
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
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-violet-600 hover:bg-violet-500 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Accessing Portal...</span>
                  </>
                ) : (
                  <>
                    <span>{loginMethod === 'otp' ? 'Send OTP →' : 'Sign In as Buyer →'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              <span>Looking to procure rural produce? </span>
              <button
                type="button"
                onClick={() => setStep('register')}
                className="font-semibold text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors ml-1"
              >
                Register your business
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
                Verify Buyer Account
              </h2>
              <p className="text-xs text-slate-300">
                Enter the 6-digit authentication code sent to your mobile.
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
              accentColor="#8B5CF6"
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
                Register Commercial Buyer Account
              </h2>
              <p className="text-xs text-slate-300">
                Direct procurement access to regional farmer producer organizations.
              </p>
            </div>

            {regError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                {regError}
              </p>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Business / APMC Firm Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahyadri Agri Traders Pvt Ltd"
                  value={regForm.businessName}
                  onChange={(e) => setRegForm({ ...regForm, businessName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Singhania"
                    value={regForm.contactPerson}
                    onChange={(e) => setRegForm({ ...regForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Buyer Category
                  </label>
                  <select
                    value={regForm.businessType}
                    onChange={(e) => setRegForm({ ...regForm, businessType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value="APMC Licensed Commission Agent & Trader">APMC Licensed Trader / Mandi Agent</option>
                    <option value="Retail Supermarket Chain">Retail Supermarket Chain</option>
                    <option value="Food Processing Unit">Food Processing Unit</option>
                    <option value="Hospitality & Institutional Buyer">Hospitality & Institutional Buyer</option>
                    <option value="Agricultural Exporter">Agricultural Exporter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PhoneInput
                  value={phone}
                  onChange={(val) => setPhone(val)}
                  label="Authorized Mobile *"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Market Location / APMC Mandi
                  </label>
                  <input
                    type="text"
                    value={regForm.location}
                    onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Optional License / GSTIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  GSTIN / APMC Trader License (Optional)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA0000A1Z5 or APMC-VSH-2024"
                    value={regForm.gstin}
                    onChange={(e) => setRegForm({ ...regForm, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm font-mono uppercase focus:outline-none focus:border-violet-500"
                  />
                  <FileBadge className="w-4 h-4 text-violet-400 absolute right-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-violet-600 hover:bg-violet-500 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 mt-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering Buyer Account...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Create Buyer Account →</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400">
              <span>Already registered? </span>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="font-semibold text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors ml-1"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        )}

        {/* 4. SUCCESS STEP */}
        {step === 'success' && (
          <VerificationSuccess
            roleTitle="Buyer / Market"
            dashboardRoute="/buyer/dashboard"
            accentColor="#8B5CF6"
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};
