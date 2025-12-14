let lockCount = 0;
const LOCK_CLASS = 'modal-open';

export const lockBodyScroll = () => {
  if (typeof document === 'undefined') return;
  lockCount += 1;
  if (lockCount === 1) {
    document.body.classList.add(LOCK_CLASS);
    document.documentElement?.classList.add(LOCK_CLASS);
  }
};

export const unlockBodyScroll = () => {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(lockCount - 1, 0);
  if (lockCount === 0) {
    document.body.classList.remove(LOCK_CLASS);
    document.documentElement?.classList.remove(LOCK_CLASS);
  }
};
