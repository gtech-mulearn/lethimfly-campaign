'use client';

import { useEffect, useRef } from 'react';

interface ShareCardProps {
  fullName: string;
  amount: string;
  campusName: string;
  commitmentId: string;
}

export default function ShareCardCanvas({ fullName, amount, campusName, commitmentId }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions
    canvas.width = 1080;
    canvas.height = 1350; // Instagram Portrait ratio

    // Draw Background
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, '#0f172a'); // Background dark
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);

    // Decorative Elements
    ctx.fillStyle = 'rgba(255, 215, 0, 0.05)'; // Gold glow
    ctx.beginPath();
    ctx.arc(1080, 0, 600, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.05)'; // Blue glow
    ctx.beginPath();
    ctx.arc(0, 1350, 600, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 40;
    ctx.strokeRect(40, 40, 1000, 1270);

    // Main Logo/Emoji
    ctx.font = 'bold 200px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪂', 540, 300);

    // Hashtag
    ctx.font = 'bold 60px "Syne", sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('#LetHimFly', 540, 420);

    // Title
    ctx.font = '800 80px "Syne", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('I COMMITTED!', 540, 550);

    // Message
    ctx.font = '400 45px "DM Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('to help Syam Kumar represent India', 540, 630);

    // User Name
    ctx.font = 'bold 110px "Syne", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(fullName.toUpperCase(), 540, 780);

    // Amount Block
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.roundRect(240, 850, 600, 180, 20);
    ctx.fill();

    ctx.font = 'bold 100px "Syne", sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`₹${amount}`, 540, 970);

    // Subtext
    ctx.font = '500 40px "DM Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`via ${campusName}`, 540, 1100);

    // Footer info
    ctx.font = '400 30px "DM Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(`Track: lethimfly.mulearn.org/track`, 540, 1220);
    ctx.fillText(`ID: ${commitmentId}`, 540, 1260);

  }, [fullName, amount, campusName, commitmentId]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `LetHimFly-Commitment-${fullName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="share-card-container" style={{ marginTop: 'var(--space-8)' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          display: 'block',
          margin: '0 auto var(--space-6) auto',
        }}
      />
      <button 
        onClick={downloadImage} 
        className="btn btn-secondary" 
        style={{ width: '100%' }}
      >
        📥 Download Share Card
      </button>
    </div>
  );
}
