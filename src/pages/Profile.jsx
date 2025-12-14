import Header from '../components/Header';
import ProfilePanel from '../components/ProfilePanel';
import './Profile.css';

const Profile = () => {
  return (
    <div className="profile-page">
      <Header />
      <main className="main-content">
        <div className="container">
          <ProfilePanel />
        </div>
      </main>
    </div>
  );
};

export default Profile;
