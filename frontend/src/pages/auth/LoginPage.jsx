import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { validators } from '../../utils/validators';
import { 
  Building2, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  AlertCircle,
  ShieldCheck,
  Shield,
  Briefcase,
  Sparkles,
  Info
} from 'lucide-react';
import './LoginPage.css';

export const LoginPage = () => {
  const { login, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Inputs start completely empty by default
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [portalMode, setPortalMode] = useState('Admin');

  // Focus states for character animation
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Mouse tracking state for pupil position
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  // Mouse movement listener on viewport
  useEffect(() => {
    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      // Calculate normalized mouse position offset (-6px to +6px)
      const normX = Math.min(Math.max((e.clientX - centerX) / 80, -6), 6);
      const normY = Math.min(Math.max((e.clientY - centerY) / 80, -5), 5);
      setMousePos({ x: normX, y: normY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handlePortalSwitch = (mode) => {
    setPortalMode(mode);
    setServerError('');
    setErrors({});
  };

  const normalizedInputUser = (formData.username || '').trim().toLowerCase();
  const isManagerCredentialEntered = normalizedInputUser.includes('manager');
  const isAdminCredentialEntered = normalizedInputUser.includes('admin');

  // Local helper notice for mismatched tab selection
  const showManagerTabNotice = portalMode === 'Admin' && isManagerCredentialEntered;
  const showAdminTabNotice = portalMode === 'Manager' && isAdminCredentialEntered;

  // Calculate eye pupil position:
  const usernameLength = formData.username.length;
  const typingEyeX = Math.min(Math.max(-7 + usernameLength * 0.7, -7), 7);
  const typingEyeY = 5; // Look down towards input field

  const eyeX = isUsernameFocused ? typingEyeX : mousePos.x;
  const eyeY = isUsernameFocused ? typingEyeY : mousePos.y;

  // Hands cover eyes when password field is focused
  const coverEyes = isPasswordFocused && !showPassword;
  const peekEyes = isPasswordFocused && showPassword;

  const validateForm = () => {
    const newErrors = {};

    const usernameErr = validators.required(formData.username, 'User ID');
    if (usernameErr) newErrors.username = usernameErr;

    const passwordErr = validators.required(formData.password, 'Password');
    if (passwordErr) {
      newErrors.password = passwordErr;
    } else if (formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Strict client-side pre-check for portal mode
    if (portalMode === 'Admin' && isManagerCredentialEntered) {
      setServerError('Access Denied: "manager_crm" is a Manager account. Please switch to the Manager Portal tab to log in.');
      return;
    }
    if (portalMode === 'Manager' && isAdminCredentialEntered) {
      setServerError('Access Denied: "crm_admin" is an Admin account. Please switch to the Admin Portal tab to log in.');
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      const response = await login(formData.username, formData.password);
      const userRole = (response.user?.role || '').toLowerCase();
      const isAdminUser = userRole === 'admin' || response.user?.is_superuser;
      const isManagerUser = userRole === 'manager' || userRole === 'sales_manager';

      // Verify portal scope against authenticated user role
      if (portalMode === 'Admin' && !isAdminUser) {
        await logout();
        setServerError('Access Denied: This account is a Manager account. Please switch to the Manager Portal tab to log in.');
        return;
      }

      if (portalMode === 'Manager' && !isManagerUser) {
        await logout();
        setServerError('Access Denied: This account is an Admin account. Please switch to the Admin Portal tab to log in.');
        return;
      }

      showToast(`Welcome back, ${response.user?.name || 'User'}!`, 'success');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="light-login-viewport">
      {/* Decorative Color Light Glare & Lens Flare Effects */}
      <div className="light-glare glare-primary" />
      <div className="light-glare glare-cyan" />
      <div className="light-glare glare-amber" />
      <div className="light-glare glare-center" />
      <div className="lens-flare-spark" />

      {/* Ambient Gradient Orbs */}
      <div className="bg-orb light-orb-indigo" />
      <div className="bg-orb light-orb-sky" />
      <div className="bg-orb light-orb-rose" />
      <div className="light-grid-overlay" />

      {/* Main Clean Light Card Container */}
      <div className="light-card-container">
        {/* Brand Bar & Portal Switcher */}
        <div className="light-card-header">
          <div className="brand-logo-row">
            <div className="logo-icon-box">
              <Building2 size={20} className="header-logo-icon" />
            </div>
            <div className="brand-title-wrap">
              <span className="brand-badge">ENTERPRISE CRM</span>
              <h1 className="brand-header-title">PL SOFT TECH</h1>
            </div>
          </div>

          <div className="portal-chips-bar">
            <button
              type="button"
              className={`portal-chip ${portalMode === 'Admin' ? 'active-admin' : ''}`}
              onClick={() => handlePortalSwitch('Admin')}
            >
              <Shield size={14} />
              <span>Admin Portal</span>
            </button>
            <button
              type="button"
              className={`portal-chip ${portalMode === 'Manager' ? 'active-manager' : ''}`}
              onClick={() => handlePortalSwitch('Manager')}
            >
              <Briefcase size={14} />
              <span>Manager Portal</span>
            </button>
          </div>
        </div>

        {/* Interactive Character Avatar SVG */}
        <div className="character-avatar-wrapper">
          <div className="avatar-circle-bg">
            <svg
              className="character-svg"
              viewBox="0 0 200 200"
              width="135"
              height="135"
            >
              {/* Hair */}
              <path
                d="M 50 85 C 50 35, 150 35, 150 85 C 150 65, 140 45, 100 45 C 60 45, 50 65, 50 85 Z"
                fill="#1E293B"
              />
              <path
                d="M 70 45 C 85 30, 115 30, 130 45 C 120 40, 80 40, 70 45 Z"
                fill="#334155"
              />

              {/* Ears */}
              <circle cx="52" cy="95" r="10" fill="#F5C49B" />
              <circle cx="148" cy="95" r="10" fill="#F5C49B" />

              {/* Face Skin */}
              <ellipse cx="100" cy="95" rx="46" ry="48" fill="#F5C49B" />

              {/* Eyebrows */}
              <path
                d={coverEyes ? "M 68 76 Q 80 78 92 76" : isUsernameFocused ? "M 68 70 Q 80 66 92 70" : "M 68 72 Q 80 66 92 72"}
                stroke="#1E293B"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={coverEyes ? "M 108 76 Q 120 78 132 76" : isUsernameFocused ? "M 108 70 Q 120 66 132 70" : "M 108 72 Q 120 66 132 72"}
                stroke="#1E293B"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Eye Sockets */}
              <circle cx="80" cy="84" r="9" fill="#FFFFFF" />
              <circle cx="120" cy="84" r="9" fill="#FFFFFF" />

              {/* Pupils with dynamic cursor & typing movement */}
              {!coverEyes && (
                <>
                  <circle
                    cx={80 + eyeX}
                    cy={84 + eyeY}
                    r="4.5"
                    fill="#1E293B"
                    className="pupil-transition"
                  />
                  <circle
                    cx={120 + eyeX}
                    cy={84 + eyeY}
                    r="4.5"
                    fill="#1E293B"
                    className="pupil-transition"
                  />
                  {/* Eye Catchlight */}
                  <circle cx={78 + eyeX * 0.8} cy={82 + eyeY * 0.8} r="1.6" fill="#FFFFFF" />
                  <circle cx={118 + eyeX * 0.8} cy={82 + eyeY * 0.8} r="1.6" fill="#FFFFFF" />
                </>
              )}

              {/* Closed Eyes Line when covering eyes */}
              {coverEyes && (
                <>
                  <path d="M 72 84 Q 80 88 88 84" stroke="#1E293B" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 112 84 Q 120 88 128 84" stroke="#1E293B" strokeWidth="3" fill="none" strokeLinecap="round" />
                </>
              )}

              {/* Nose */}
              <path
                d="M 100 85 L 96 97 L 104 97 Z"
                fill="#E8AB7D"
              />

              {/* Beard & Mustache */}
              <path
                d="M 54 96 C 54 142, 146 142, 146 96 C 146 120, 135 148, 100 148 C 65 148, 54 120, 54 96 Z"
                fill="#1E293B"
              />
              {/* Mustache */}
              <path
                d="M 75 106 Q 100 114 125 106 Q 100 100 75 106 Z"
                fill="#0F172A"
              />

              {/* Shirt & Apron */}
              <path
                d="M 55 148 L 145 148 L 160 200 L 40 200 Z"
                fill="#3B82F6"
              />
              <path
                d="M 75 148 L 125 148 L 130 200 L 70 200 Z"
                fill="#1E293B"
              />

              {/* Animated Hands (Smoothly covers eyes when typing password) */}
              <g
                className={`hands-group ${
                  coverEyes ? 'cover-eyes' : peekEyes ? 'peek-eyes' : 'hands-down'
                }`}
              >
                {/* Left Hand & Palm */}
                <path
                  d="M 40 180 C 45 130, 62 76, 78 76 C 88 76, 92 88, 78 118 C 70 135, 55 160, 40 180 Z"
                  fill="#F5C49B"
                  stroke="#E8AB7D"
                  strokeWidth="2.5"
                />
                <circle cx="78" cy="80" r="10" fill="#F5C49B" />
                <circle cx="86" cy="82" r="8" fill="#F5C49B" />

                {/* Right Hand & Palm */}
                <path
                  d="M 160 180 C 155 130, 138 76, 122 76 C 112 76, 108 88, 122 118 C 130 135, 145 160, 160 180 Z"
                  fill="#F5C49B"
                  stroke="#E8AB7D"
                  strokeWidth="2.5"
                />
                <circle cx="122" cy="80" r="10" fill="#F5C49B" />
                <circle cx="114" cy="82" r="8" fill="#F5C49B" />
              </g>
            </svg>
          </div>
        </div>

        {/* Global Server Error Banner */}
        {serverError && (
          <div className="light-error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="light-form" noValidate>
          {/* Email / User ID Field */}
          <div className="light-field-group">
            <label className="light-label" htmlFor="username">
              Email / User ID
            </label>
            <div className="light-input-wrapper">
              <User size={18} className="field-inner-icon" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="off"
                className={`light-input ${errors.username ? 'error' : ''} ${showManagerTabNotice || showAdminTabNotice ? 'warning' : ''}`}
                placeholder="Enter user ID..."
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setIsUsernameFocused(true)}
                onBlur={() => setIsUsernameFocused(false)}
                disabled={isSubmitting}
              />
            </div>
            {errors.username && <span className="light-error-text">{errors.username}</span>}

            {/* Smart Tab Switch Hints */}
            {showManagerTabNotice && (
              <div className="light-hint-box" onClick={() => handlePortalSwitch('Manager')}>
                <Info size={14} />
                <span>Manager credential detected. <strong>Switch to Manager Portal</strong></span>
              </div>
            )}
            {showAdminTabNotice && (
              <div className="light-hint-box" onClick={() => handlePortalSwitch('Admin')}>
                <Info size={14} />
                <span>Admin credential detected. <strong>Switch to Admin Portal</strong></span>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="light-field-group">
            <label className="light-label" htmlFor="password">
              Password
            </label>
            <div className="light-input-wrapper">
              <Lock size={18} className="field-inner-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                className={`light-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="light-eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="light-error-text">{errors.password}</span>}
          </div>

          {/* Log In Button */}
          <button
            type="submit"
            className="light-login-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Log in to {portalMode} Portal</span>
                <ArrowRight size={18} className="btn-arrow-icon" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Badge */}
        <div className="light-footer-strip">
          <ShieldCheck size={14} />
          <span>256-Bit SSL Encrypted • Single Sign-On Ready</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
