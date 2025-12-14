import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const getFriendlyAuthError = (error) => {
  const code = error?.code;
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This origin is not authorized for Google Sign-In. Add your dev/production domains in Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Google Sign-In needs to run from HTTPS (or localhost). If you are using a LAN IP, enable HTTPS (`npm run dev -- --host --https`) or deploy to an HTTPS host.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Google. Check your connection and try again.';
    case 'auth/web-storage-unsupported':
      return 'This browser blocks local storage. Enable cookies/storage or try a different browser.';
    case 'auth/popup-blocked':
      return 'The popup was blocked. Allow popups for this site or try again.';
    default:
      return 'Unable to sign in with Google. Please try again.';
  }
};

const Login = () => {
  const { isAuthenticated, login, loginWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      navigate('/', { replace: true });
    }
  }, [login, navigate, searchParams]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setRedirecting(true);
      navigate('/', { replace: true });
    } else {
      setRedirecting(false);
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const mode = await loginWithGoogle();
      if (mode !== 'redirect') {
        navigate('/');
      }
    } catch (err) {
      console.error('Google login failed', err);
      setError(getFriendlyAuthError(err));
    }
  };

  if (redirecting) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <p>Redirecting you to the home page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1>🥜 Welcome to Dry Fruits Shop</h1>
          <p>Sign in with your Google account to start shopping 000.001</p>
          
          <button className="google-login-btn" onClick={handleGoogleLogin}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.805 10.227c0-.709-.064-1.39-.182-2.045H10.2v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.987-4.305 2.987-7.35z" fill="#4285F4"/>
              <path d="M10.2 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.245v2.59A9.996 9.996 0 0010.2 20z" fill="#34A853"/>
              <path d="M4.605 11.9a6.015 6.015 0 010-3.8V5.51H1.245a9.996 9.996 0 000 8.98l3.36-2.59z" fill="#FBBC04"/>
              <path d="M10.2 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C15.159.991 12.895 0 10.2 0A9.996 9.996 0 001.245 5.51l3.36 2.59c.786-2.364 2.99-4.123 5.595-4.123z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
          
          <div className="login-info">
            {error && <p className="error-message">{error}</p>}
            <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
