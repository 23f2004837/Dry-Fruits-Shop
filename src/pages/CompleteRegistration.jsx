import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import './CompleteRegistration.css';

const CompleteRegistration = () => {
  const [flatNumber, setFlatNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const validateFlatNumber = (value) => {
    const pattern = /^[A-Z]-\d+$/;
    return pattern.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateFlatNumber(flatNumber)) {
      setError('Please enter a valid flat number (e.g., A-703 or B-2201)');
      return;
    }

    setLoading(true);
    try {
      const token = searchParams.get('token');
      if (!token) {
        setError('Invalid registration link');
        return;
      }

      const response = await authAPI.completeRegistration(token, flatNumber);
      login(response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const handleFlatNumberChange = (e) => {
    const value = e.target.value.toUpperCase();
    setFlatNumber(value);
    setError('');
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-card">
          <h1>Complete Your Registration</h1>
          <p>Please provide your flat number to complete the registration</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="flatNumber">Flat Number</label>
              <input
                id="flatNumber"
                type="text"
                value={flatNumber}
                onChange={handleFlatNumberChange}
                placeholder="e.g., A-703 or B-2201"
                required
                disabled={loading}
              />
              <small>Format: Tower-FlatNumber (e.g., A-703, B-2201)</small>
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
