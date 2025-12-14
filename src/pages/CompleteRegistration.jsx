import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import './CompleteRegistration.css';

const initialForm = {
  name: '',
  email: '',
  mobile: '',
  flatNumber: '',
  password: '',
  confirmPassword: ''
};

const CompleteRegistration = () => {
  const [formValues, setFormValues] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const validateFlatNumber = (value) => {
    const pattern = /^[A-Z]-\d+$/;
    return pattern.test(value);
  };

  const validateEmail = (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value.trim());
  };

  const validateMobile = (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const validatePassword = (value) => value.trim().length >= 8;

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    if (field === 'flatNumber') {
      value = value.toUpperCase();
    }
    if (field === 'mobile') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formValues.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!validateEmail(formValues.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validateMobile(formValues.mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!validateFlatNumber(formValues.flatNumber)) {
      setError('Please enter a valid flat number (e.g., A-703 or B-2201).');
      return;
    }

    if (!validatePassword(formValues.password)) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formValues.password !== formValues.confirmPassword) {
      setError('Password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const tokenFromLink = searchParams.get('token');
      const payload = {
        name: formValues.name.trim(),
        email: formValues.email.trim().toLowerCase(),
        mobile: formValues.mobile.trim(),
        flatNumber: formValues.flatNumber.trim(),
        password: formValues.password
      };

      if (tokenFromLink) {
        payload.token = tokenFromLink;
      }

      const response = await authAPI.completeRegistration(payload);
      const responseData = response?.data ?? {};
      const profile = responseData.user ?? {
        name: payload.name,
        email: payload.email,
        mobile: payload.mobile,
        flatNumber: payload.flatNumber,
        createdAt: new Date().toISOString()
      };

      const issuedToken = responseData.token ?? tokenFromLink ?? `local-${payload.email}-${Date.now()}`;
      login(issuedToken, profile);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-card">
          <h1>Complete Your Registration</h1>
          <p>Tell us how to reach you so we can personalize your experience.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={formValues.name}
                  onChange={handleChange('name')}
                  placeholder="Skydale Resident"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={formValues.email}
                  onChange={handleChange('email')}
                  placeholder="name@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number</label>
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  value={formValues.mobile}
                  onChange={handleChange('mobile')}
                  placeholder="10-digit number"
                  required
                  disabled={loading}
                />
                <small>Only digits – we&apos;ll use this to update you about orders.</small>
              </div>

              <div className="form-group">
                <label htmlFor="flatNumber">Flat Number</label>
                <input
                  id="flatNumber"
                  type="text"
                  value={formValues.flatNumber}
                  onChange={handleChange('flatNumber')}
                  placeholder="e.g., A-703 or B-2201"
                  required
                  disabled={loading}
                />
                <small>Format: Tower-FlatNumber (e.g., A-703, B-2201)</small>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="password">Create Password</label>
                <input
                  id="password"
                  type="password"
                  value={formValues.password}
                  onChange={handleChange('password')}
                  placeholder="At least 8 characters"
                  required
                  disabled={loading}
                />
                <small>Use a password you can remember. Minimum 8 characters.</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formValues.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  placeholder="Re-enter password"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="consent" className="checkbox-label">
                <input type="checkbox" id="consent" required disabled={loading} />
                I agree to share my details for order communication.
              </label>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Completing...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteRegistration;
