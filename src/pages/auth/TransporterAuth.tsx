import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Mail, Phone, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { PhoneInput } from '../../components/auth/PhoneInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { OTPInput } from '../../components/auth/OTPInput';
import { VerificationSuccess } from '../../components/auth/VerificationSuccess';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';

type AuthStep = 'login' | 'otp' | 'register' | 'success';
type LoginMethod = 'otp' | 'password';

export const TransporterAuth: React.FC = () => {
  const { login, register } = useSharedContext();
  const { t } = useLanguage();
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
    vehicleType: 'Bolero Pickup (1.5 - 2.5 MT)',
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

    if (!regForm.fullName.trim() || !regForm.email.trim() || !regForm.password) {
      setRegError('Please complete all mandatory fields');
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
          name: regForm.fullName.trim(),
          email: regForm.email.trim(),
          password: regForm.password,
          role: 'TRANSPORTER',
          phone: undefined, // Fix: Do not send hardcoded OTP phone state during email registration to prevent unique constraint 409 error
          fullName: regForm.fullName.trim(),
          vehicleType: regForm.vehicleType,
          operatingRegion: regForm.operatingRegion,
          ownership: regForm.ownership,
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
      roleName={t('gateway.role.transporter.badge') || "Transporter"}
      roleIcon={Truck}
      headline={t('auth.transporter.title') || "Maximize fleet utilization."}
      supportingText={t('auth.transporter.subtitle') || "Reduce empty miles by finding local return loads, managing routes, and tracking payments seamlessly."}
      benefits={[
        {
          title: t('auth.transporter.benefit1.title') || 'Fill empty return trips',
          desc: t('auth.transporter.benefit1.desc') || 'Get notified for on-route farm pickups matching your truck capacity.',
        },
        {
          title: t('auth.transporter.benefit2.title') || 'Direct transporter payout',
          desc: t('auth.transporter.benefit2.desc') || 'Transparent trip fares deposited directly into your verified bank account.',
        },
        {
          title: t('auth.transporter.benefit3.title') || 'Manage your vehicle fleet',
          desc: t('auth.transporter.benefit3.desc') || 'Register vehicles, track maintenance, and accept capacity-matched trips.',
        },
      ]}
      roleAccessText={t('auth.security.transporter_access') || 'Transporter Access'}
      accentColorHex="#C2410C"
      accentBorderClass="border-amber-200"
      accentBgClass="bg-amber-50"
      accentTextClass="text-amber-800"
      imageUrl="/images/transporter-truck.jpg"
      imageAlt="Indian rural transport mini-truck"
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
                {t('auth.transporter.title') || 'Transporter Sign In'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {t('auth.transporter.subtitle') || 'Sign in to discover freight, manage your vehicles, and accept trips.'}
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
                <span>{t('auth.email_password')}</span>
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
                <span>{t('auth.mobile_otp')}</span>
              </button>
            </div>

            {loginError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg font-medium">
                {loginError}
              </p>
            )}

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
                      {t('auth.transporter_email_id')}</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      disabled={isSubmitting}
                      placeholder={t('auth.transporterruralflowin')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-600"
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
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-amber-700 hover:bg-amber-800 transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{t('auth.signing_in')}</span>
                ) : (
                  <>
                    <span>{t('auth.continue_to_transporter_dashbo')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-gray-600">
              <span>{t('auth.new_transport_partner')}</span>
              <button
                type="button"
                onClick={() => setStep('register')}
                className="text-amber-800 hover:underline font-bold cursor-pointer"
              >
                {t('auth.register_as_transporter')}</button>
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
              accentColor="#C2410C"
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
                {t('auth.transporter_registration')}</h2>
              <p className="text-xs text-gray-600">
                {t('auth.register_as_a_rural_fleet_part')}</p>
            </div>

            {regError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg font-medium">
                {regError}
              </p>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('auth.full_name_fleet_owner_name_')}</label>
                <input
                  type="text"
                  required
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  placeholder={t('auth.eg_sunil_deshmukh')}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('auth.email_address_')}</label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder={t('auth.sunillogisticsin')}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('auth.password_min_8_chars_')}</label>
                  <input
                    type="password"
                    required
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('auth.primary_vehicle_type')}</label>
                  <select
                    value={regForm.vehicleType}
                    onChange={(e) => setRegForm({ ...regForm, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Bolero Pickup (1.5 - 2.5 MT)">{t('auth.bolero_pickup_15_25_mt')}</option>
                    <option value="Tata Ace (Mini Truck 750 kg)">{t('auth.tata_ace_mini_truck_750_kg')}</option>
                    <option value="Medium Goods Carrier (3.5 MT)">{t('auth.medium_goods_carrier_35_mt')}</option>
                    <option value="Three Wheeler Cargo (500 kg)">{t('auth.three_wheeler_cargo_500_kg')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('auth.operating_hub_region')}</label>
                  <input
                    type="text"
                    value={regForm.operatingRegion}
                    onChange={(e) => setRegForm({ ...regForm, operatingRegion: e.target.value })}
                    placeholder={t('auth.eg_pune_satara')}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-amber-700 hover:bg-amber-800 transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (t('auth.registering') || 'Registering...') : (t('auth.complete_transporter_registration') || 'Register as Transporter')}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-gray-600">
              <span>{t('auth.already_registered')}</span>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="text-amber-800 hover:underline font-bold cursor-pointer"
              >
                {t('auth.sign_in')}</button>
            </div>
          </motion.div>
        )}

        {/* 4. SUCCESS STEP */}
        {step === 'success' && (
          <VerificationSuccess
            roleTitle={t('auth.transporter.partner_title') || "Transporter Fleet Partner"}
            dashboardRoute="/transporter/dashboard"
            accentColor="#C2410C"
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};
