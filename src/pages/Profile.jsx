import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <Header />
      
      <main className="main-content">
        <div className="container">
          <div className="profile-card">
            <h2>My Profile</h2>
            
            <div className="profile-content">
              <div className="profile-avatar-section">
                <img 
                  src={user.photo || 'https://via.placeholder.com/150'} 
                  alt="Profile" 
                  className="profile-avatar-large"
                />
              </div>
              
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user.email}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Flat Number:</span>
                  <span className="info-value">{user.flatNumber}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Member Since:</span>
                  <span className="info-value">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
