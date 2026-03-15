'use client';

const CAMPAIGN_URL = 'https://lethimfly.mulearn.org';

export default function ShareButton({ title, campusId }: { title?: string; campusId?: string }) {
  const handleShare = () => {
    const url = campusId
      ? `${CAMPAIGN_URL}/?commit=true&campus=${campusId}`
      : CAMPAIGN_URL;

    const text = title
      ? `${title} — Join the #LetHimFly campaign and help Syam Kumar fly for India 🇮🇳`
      : 'Join the #LetHimFly campaign and help Syam Kumar fly for India 🇮🇳';

    if (navigator.share) {
      navigator.share({ title: '#LetHimFly', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-secondary btn-lg"
      onClick={handleShare}
      style={{ textAlign: 'center', width: '100%' }}
    >
      📣 Invite Classmates
    </button>
  );
}
