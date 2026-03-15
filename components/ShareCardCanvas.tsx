'use client';

import { useEffect, useRef, useState } from 'react';

const CAMPAIGN_URL = 'lethimfly.mulearn.org';

interface ShareCardProps {
  fullName: string;
  amount: string;
  campusName: string;
  commitmentId: string;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function ShareCardCanvas({ fullName, amount, campusName, commitmentId }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shareReady, setShareReady] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // --- Background ---
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a0a0f');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#0a0f1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // --- Radial glow top-right ---
    const glow1 = ctx.createRadialGradient(W, 0, 0, W, 0, 700);
    glow1.addColorStop(0, 'rgba(250,204,21,0.12)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    // --- Radial glow bottom-left ---
    const glow2 = ctx.createRadialGradient(0, H, 0, 0, H, 600);
    glow2.addColorStop(0, 'rgba(56,189,248,0.08)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // --- Gold accent line top ---
    const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.3, '#facc15');
    lineGrad.addColorStop(0.7, '#facc15');
    lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(0, 0, W, 4);

    // --- Paraglider emoji ---
    ctx.font = '180px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪂', W / 2, 260);

    // --- #LetHimFly ---
    ctx.font = 'bold 52px monospace';
    ctx.fillStyle = '#facc15';
    ctx.letterSpacing = '4px';
    ctx.fillText('#LETHIMFLY', W / 2, 350);
    ctx.letterSpacing = '0px';

    // --- "I COMMITTED!" pill background ---
    ctx.fillStyle = 'rgba(250,204,21,0.12)';
    ctx.beginPath();
    ctx.roundRect(240, 380, 600, 90, 45);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250,204,21,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 52px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('I COMMITTED!', W / 2, 440);

    // --- Divider ---
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 510);
    ctx.lineTo(960, 510);
    ctx.stroke();

    // --- "to help" label ---
    ctx.font = '400 38px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('to help Syam Kumar fly for India 🇮🇳', W / 2, 575);

    // --- Name ---
    ctx.font = 'bold 96px sans-serif';
    ctx.fillStyle = '#ffffff';
    const nameLines = wrapText(ctx, fullName.toUpperCase(), 900);
    nameLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, 690 + i * 110);
    });

    const afterName = 690 + nameLines.length * 110;

    // --- Amount badge ---
    const amtY = afterName + 40;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.roundRect(280, amtY, 520, 150, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250,204,21,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '400 30px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('COMMITTED AMOUNT', W / 2, amtY + 48);

    ctx.font = 'bold 88px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`₹${amount}`, W / 2, amtY + 130);

    // --- Campus ---
    const campusY = amtY + 210;
    ctx.font = '400 36px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const campusLines = wrapText(ctx, campusName, 800);
    campusLines.forEach((line, i) => {
      ctx.fillText(line, W / 2, campusY + i * 50);
    });

    // --- Bottom divider ---
    const footerTop = H - 180;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, footerTop);
    ctx.lineTo(960, footerTop);
    ctx.stroke();

    // --- CTA ---
    ctx.font = '500 34px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('Join me. Commit at:', W / 2, footerTop + 56);

    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText(CAMPAIGN_URL, W / 2, footerTop + 112);

    // --- Gold line bottom ---
    ctx.fillStyle = lineGrad;
    ctx.fillRect(0, H - 4, W, 4);

    setShareReady(true);
  }, [fullName, amount, campusName, commitmentId]);

  const getBlob = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject(new Error('No canvas'));
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    });

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `LetHimFly-${fullName.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleNativeShare = async () => {
    setSharing(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], `LetHimFly-${fullName}.png`, { type: 'image/png' });
      const shareText = `I just committed ₹${amount} to help Syam Kumar fly for India 🇮🇳 from ${campusName}!\n\nJoin the #LetHimFly campaign 👇\nhttps://${CAMPAIGN_URL}`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
      } else if (navigator.share) {
        await navigator.share({ title: '#LetHimFly', text: shareText, url: `https://${CAMPAIGN_URL}` });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    } finally {
      setSharing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
      {/* Canvas preview */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            borderRadius: '16px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            display: 'block',
          }}
        />
        {!shareReady && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '16px',
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 'var(--text-sm)',
          }}>
            Generating...
          </div>
        )}
      </div>

      {shareReady && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
          {/* Primary: native share (shows share sheet on mobile with image) */}
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={sharing}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {sharing ? 'Opening...' : '📤 Share this card'}
          </button>

          {/* Secondary: download for Instagram Stories */}
          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            📥 Download for Instagram Story
          </button>
        </div>
      )}
    </div>
  );
}
