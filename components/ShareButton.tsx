'use client';

export default function ShareButton({ title, campusId }: { title?: string; campusId?: string }) {
  const handleShare = () => {
    const url = campusId
      ? `${window.location.origin}/?commit=true&campus=${campusId}`
      : window.location.href;

    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <button
      className="btn btn-secondary btn-lg"
      onClick={handleShare}
      style={{ textAlign: 'center', width: '100%' }}
    >
      📣 Invite Classmates
    </button>
  );
}
