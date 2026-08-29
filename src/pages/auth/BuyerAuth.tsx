import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Mail, Phone, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { PhoneInput } from '../../components/auth/PhoneInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { OTPInput } from '../../components/auth/OTPInput';
import { VerificationSuccess } from '../../components/auth/VerificationSuccess';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';

type AuthStep = 'login' | 'otp' | 'register' | 'success';
type LoginMethod = 'otp' | 'password';

export const BuyerAuth: React.FC = () => {
  const { login, register } = useSharedContext();
  const { t } = useLanguage();
  const [step, setStep] = useState<AuthStep>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [phone, setPhone] = useState('9876543211');
  const [email, setEmail] = useState('buyer@ruralflow.in');
  const [password, setPassword] = useState('password123');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Form
  const [regForm, setRegForm] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    password: '',
    location: 'Navi Mumbai APMC Mandi',
    businessType: 'Retailer & Distributor',
    gstin: '',
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
        setEmailError('Please enter a valid business email');
        return;
      }
      if (password.length < 6) {
        setLoginError('Password must be at least 6 characters');
        return;
      }

      setIsSubmitting(true);
      try {
        await login(email, password, 'BUYER');
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
        await login('buyer@ruralflow.in', 'password123', 'BUYER');
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

    if (!regForm.businessName.trim() || !regForm.email.trim() || !regForm.password) {
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
          name: regForm.contactPerson.trim() || regForm.businessName.trim(),
          email: regForm.email.trim(),
          password: regForm.password,
          role: 'BUYER',
          phone: undefined, // Fix: Do not send hardcoded OTP phone state during email registration to prevent unique constraint 409 error
          businessName: regForm.businessName.trim(),
          contactPerson: regForm.contactPerson.trim() || undefined,
          location: regForm.location,
          businessType: regForm.businessType,
          gstin: regForm.gstin.trim() || undefined,
        },
        'BUYER'
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
      roleName={t('gateway.role.buyer.badge') || "Buyer"}
      roleIcon={Store}
      headline={t('auth.buyer.title') || "Secure quality produce directly."}
      supportingText={t('auth.buyer.subtitle') || "Bypass intermediaries, track shipments in real-time, and guarantee steady supply chains."}
      benefits={[
        {
          title: t('auth.buyer.benefit1.title') || 'Direct farm sourcing',
          desc: t('auth.buyer.benefit1.desc') || 'Connect with verified regional farmer clusters with transparent harvest timelines.',
        },
        {
          title: t('auth.buyer.benefit2.title') || 'Broadcast procurement demand',
          desc: t('auth.buyer.benefit2.desc') || 'Post required quantities and target pricing to discover matching farm produce.',
        },
        {
          title: t('auth.buyer.benefit3.title') || 'Verified shipment tracking',
          desc: t('auth.buyer.benefit3.desc') || 'Monitor incoming freight from rural farm-gate pickups to your warehouse.',
        },
      ]}
      roleAccessText={t('auth.security.buyer_access') || 'Buyer Access'}
      accentColorHex="#1D4ED8"
      accentBorderClass="border-blue-200"
      accentBgClass="bg-blue-50"
      accentTextClass="text-blue-700"
      imageUrl="/images/buyer-produce.jpg"
      imageAlt="Wholesale produce at Indian mandi"
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
                {t('auth.buyer.title') || 'Buyer Sign In'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {t('auth.buyer.subtitle') || 'Sign in to post procurement demands and manage incoming farm shipments.'}
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
                      {t('auth.business_email_id')}</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      disabled={isSubmitting}
                      placeholder={t('auth.buyerruralflowin')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
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
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{t('auth.signing_in')}</span>
                ) : (
                  <>
                    <span>{t('auth.continue_to_buyer_dashboard')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-gray-600">
              <span>{t('auth.new_commercial_buyer')}</span>
              <button
                type="button"
                onClick={() => setStep('register')}
                className="text-blue-700 hover:underline font-bold cursor-pointer"
              >
                {t('auth.register_as_buyer')}</button>
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
              accentColor="#1D4ED8"
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
                {t('auth.buyer_registration')}</h2>
              <p className="text-xs text-gray-600">
                {t('auth.register_your_business_to_post')}</p>
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
                    {t('auth.company_firm_name_')}</label>
                  <input
                    type="text"
                    required
                    value={regForm.businessName}
                    onChange={(e) => setRegForm({ ...regForm, businessName: e.target.value })}
                    placeholder={t('auth.eg_mahavir_agro_traders')}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('auth.contact_person')}</label>
                  <input
                    type="text"
                    value={regForm.contactPerson}
                    onChange={(e) => setRegForm({ ...regForm, contactPerson: e.target.value })}
                    placeholder={t('auth.eg_suresh_jain')}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('auth.business_email_')}</label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder={t('auth.sureshmahaviragrocom')}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:outline-none"
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
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('auth.business_category')}</label>
                  <select
                    value={regForm.businessType}
                    onChange={(e) => setRegForm({ ...regForm, businessType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Retailer & Distributor">{t('auth.retailer_distributor')}</option>
                    <option value="Wholesale Mandi Trader">{t('auth.wholesale_mandi_trader')}</option>
                    <option value="Food Processing Enterprise">{t('auth.food_processing_enterprise')}</option>
                    <option value="Export Merchant">{t('auth.export_merchant')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('auth.delivery_hub_location')}</label>
                  <input
                    type="text"
                    value={regForm.location}
                    onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                    placeholder={t('auth.eg_navi_mumbai_apmc')}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (t('auth.registering') || 'Registering...') : (t('auth.complete_buyer_registration') || 'Complete Buyer Registration')}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-gray-600">
              <span>{t('auth.already_registered')}</span>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="text-blue-700 hover:underline font-bold cursor-pointer"
              >
                {t('auth.sign_in')}</button>
            </div>
          </motion.div>
        )}

        {/* 4. SUCCESS STEP */}
        {step === 'success' && (
          <VerificationSuccess
            roleTitle={t('auth.buyer.partner_title') || "Commercial Buyer"}
            dashboardRoute="/buyer/dashboard"
            accentColor="#1D4ED8"
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};
