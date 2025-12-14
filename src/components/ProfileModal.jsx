import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProfilePanel from './ProfilePanel';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import './ProfileModal.css';

const ProfileModal = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h3>My Profile</h3>
          <button type="button" className="profile-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="profile-modal-body">
          <ProfilePanel />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileModal;
