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

// amount kept in props for API compatibility but not rendered on the card
export default function ShareCardCanvas({ fullName, campusName, commitmentId }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shareReady, setShareReady] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    const loadImg = (src: string): Promise<HTMLImageElement> =>
      new Promise((res) => {
        const img = new window.Image();
        img.onload = () => res(img);
        img.onerror = () => res(img); // draw nothing if missing
        img.src = src;
      });

    Promise.all([
      loadImg('/logo-lethimfly.png'),
      loadImg('/logo-mulearn.png'),
    ]).then(([leftImg, rightImg]) => {
      const PAD = 60;

      // helper: 4-point star ✦
      const drawStar = (cx: number, cy: number, r: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 - Math.PI / 4;
          const ia = a + Math.PI / 4;
          if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.lineTo(cx + Math.cos(ia) * r * 0.32, cy + Math.sin(ia) * r * 0.32);
        }
        ctx.closePath();
        ctx.fill();
      };

      // ─────────────────────────────────────────
      // BACKGROUND
      // ─────────────────────────────────────────
      ctx.fillStyle = '#fffdf5';
      ctx.fillRect(0, 0, W, H);

      // Big warm yellow radial — centre card
      const bg1 = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, W);
      bg1.addColorStop(0,   'rgba(255,220,20,0.38)');
      bg1.addColorStop(0.5, 'rgba(255,220,20,0.12)');
      bg1.addColorStop(1,   'transparent');
      ctx.fillStyle = bg1;
      ctx.fillRect(0, 0, W, H);

      // Top-left corner burst
      const bg2 = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 1.0);
      bg2.addColorStop(0,    'rgba(255,210,0,0.45)');
      bg2.addColorStop(0.4,  'rgba(255,210,0,0.12)');
      bg2.addColorStop(1,    'transparent');
      ctx.fillStyle = bg2;
      ctx.fillRect(0, 0, W, H);

      // Bottom-right subtle warmth
      const bg3 = ctx.createRadialGradient(W, H, 0, W, H, W * 0.9);
      bg3.addColorStop(0,   'rgba(255,180,0,0.22)');
      bg3.addColorStop(0.6, 'rgba(255,180,0,0.04)');
      bg3.addColorStop(1,   'transparent');
      ctx.fillStyle = bg3;
      ctx.fillRect(0, 0, W, H);

      // Scattered tiny star accents (background texture)
      const starPositions = [
        [120, 520], [960, 480], [80, 1100], [1000, 1050],
        [160, 1560], [920, 1580], [540, 290], [200, 870], [880, 860],
      ];
      starPositions.forEach(([sx, sy]) =>
        drawStar(sx, sy, 14, 'rgba(180,130,0,0.18)')
      );

      // ─────────────────────────────────────────
      // AMBER BARS — top & bottom
      // ─────────────────────────────────────────
      const bar = ctx.createLinearGradient(0, 0, W, 0);
      bar.addColorStop(0,    'transparent');
      bar.addColorStop(0.12, '#c8940a');
      bar.addColorStop(0.88, '#c8940a');
      bar.addColorStop(1,    'transparent');
      ctx.fillStyle = bar;
      ctx.fillRect(0, 0, W, 9);
      ctx.fillRect(0, H - 9, W, 9);

      // ─────────────────────────────────────────
      // LOGOS
      // ─────────────────────────────────────────
      const LY = 48, LH = 140;

      if (leftImg.naturalWidth) {
        const lW = LH * (leftImg.naturalWidth / leftImg.naturalHeight);
        ctx.drawImage(leftImg, PAD, LY, lW, LH);
      }
      if (rightImg.naturalWidth) {
        const rH = 74;
        const rW = Math.min(rH * (rightImg.naturalWidth / rightImg.naturalHeight), 240);
        const rActualH = rW / (rightImg.naturalWidth / rightImg.naturalHeight);
        ctx.drawImage(rightImg, W - PAD - rW, LY + (LH - rActualH) / 2, rW, rActualH);
      }

      // Separator
      const sepY = LY + LH + 32;
      ctx.strokeStyle = 'rgba(180,130,0,0.20)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PAD, sepY);
      ctx.lineTo(W - PAD, sepY);
      ctx.stroke();

      // ─────────────────────────────────────────
      // MOVEMENT BADGE
      // ─────────────────────────────────────────
      ctx.textAlign = 'center';
      const badgeY = sepY + 44;
      const badgeW = 560, badgeH = 68;
      const badgeX = (W - badgeW) / 2;

      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 34);
      ctx.fill();

      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.fillText('✦   LETHIMFLY MOVEMENT   ✦', W / 2, badgeY + 45);

      let y = badgeY + badgeH + 80;

      // ─────────────────────────────────────────
      // "I STOOD UP FOR"  →  #LetHimFly
      // ─────────────────────────────────────────
      ctx.font = '500 44px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.36)';
      ctx.fillText('I  S T O O D  U P  F O R', W / 2, y);
      y += 160;

      // #LetHimFly — huge, shadow for depth
      ctx.save();
      ctx.shadowColor = 'rgba(200,148,10,0.35)';
      ctx.shadowBlur = 28;
      ctx.font = 'bold 168px sans-serif';
      ctx.fillStyle = '#111111';
      ctx.fillText('#LetHimFly', W / 2, y);
      ctx.restore();
      y += 48;

      // Gold underline — thick, bold
      const ul = ctx.createLinearGradient(0, 0, W, 0);
      ul.addColorStop(0,    'transparent');
      ul.addColorStop(0.18, '#facc15');
      ul.addColorStop(0.82, '#facc15');
      ul.addColorStop(1,    'transparent');
      ctx.strokeStyle = ul;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(140, y); ctx.lineTo(940, y);
      ctx.stroke();
      y += 90;

      // ─────────────────────────────────────────
      // EMOTIONAL COPY — 2 punchy lines
      // ─────────────────────────────────────────
      ctx.font = 'bold 52px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillText('16 surgeries. One dream.', W / 2, y);
      y += 76;
      ctx.font = '400 48px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.50)';
      ctx.fillText('Help him reach the sky. 🇮🇳', W / 2, y);
      y += 110;

      // ─────────────────────────────────────────
      // NAME BLOCK — commitment stamp
      // ─────────────────────────────────────────
      ctx.font = 'bold 108px sans-serif';
      const nameLines = wrapText(ctx, fullName.toUpperCase(), W - 200);
      const pillH = nameLines.length * 130 + 120;

      // Yellow pill with slight inner gradient
      const pillGrad = ctx.createLinearGradient(0, y, 0, y + pillH);
      pillGrad.addColorStop(0,   '#ffdd22');
      pillGrad.addColorStop(1,   '#f5b800');
      ctx.fillStyle = pillGrad;
      ctx.beginPath();
      ctx.roundRect(PAD, y, W - PAD * 2, pillH, 32);
      ctx.fill();
      ctx.strokeStyle = 'rgba(160,110,0,0.35)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Star accents inside pill — top-left & top-right
      drawStar(PAD + 38, y + 38, 20, 'rgba(0,0,0,0.18)');
      drawStar(W - PAD - 38, y + 38, 20, 'rgba(0,0,0,0.18)');

      // "COMMITTED BY"
      ctx.font = '600 32px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillText('COMMITTED BY', W / 2, y + 62);

      // Name
      ctx.font = 'bold 108px sans-serif';
      ctx.fillStyle = '#0f0f0f';
      nameLines.forEach((line, i) => {
        ctx.fillText(line, W / 2, y + 182 + i * 130);
      });

      y += pillH + 44;

      // Campus
      ctx.font = '400 40px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.44)';
      wrapText(ctx, '📍  ' + campusName, W - 200).forEach((line, i) => {
        ctx.fillText(line, W / 2, y + i * 58);
      });
      // ─────────────────────────────────────────
      // FOOTER — anchored to bottom
      // ─────────────────────────────────────────
      const footY = H - 244;

      // HASHTAG TAG — just above footer divider
      const tagText = '#SyamChettanParakkatte';
      ctx.font = 'bold 48px sans-serif';
      const tagW = ctx.measureText(tagText).width + 80;
      const tagH = 76;
      const tagX = (W - tagW) / 2;
      const tagY = footY - tagH - 28;

      ctx.fillStyle = 'rgba(250,204,21,0.22)';
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 38);
      ctx.fill();
      ctx.strokeStyle = '#c8940a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#7a5200';
      ctx.fillText(tagText, W / 2, tagY + 52);

      // PARAGLIDER — just above the tag
      const gliderY = tagY - 50;
      ctx.font = '120px serif';
      ctx.fillText('🪂', W / 2, gliderY);

      // Small birds flanking the glider
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ([[310, gliderY - 40], [380, gliderY - 64], [700, gliderY - 62], [775, gliderY - 36]] as [number,number][]).forEach(([bx, by]) => {
        ctx.beginPath();
        ctx.moveTo(bx - 18, by); ctx.lineTo(bx, by - 14); ctx.lineTo(bx + 18, by);
        ctx.stroke();
      });

      ctx.strokeStyle = 'rgba(0,0,0,0.10)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(PAD, footY);
      ctx.lineTo(W - PAD, footY);
      ctx.stroke();

      ctx.font = '400 32px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.fillText('Join the movement at', W / 2, footY + 54);

      ctx.font = 'bold 56px monospace';
      ctx.fillStyle = '#b8860b';
      ctx.fillText(CAMPAIGN_URL, W / 2, footY + 132);

      ctx.font = '400 28px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillText('Powered by μLearn', W / 2, footY + 186);

      setShareReady(true);
    });
  }, [fullName, campusName, commitmentId]);

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
      const shareText = `I'm part of the #LetHimFly campaign, standing with Syam Kumar as he chases a world record for India 🇮🇳\n\nJoin us 👇\nhttps://${CAMPAIGN_URL}`;

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
