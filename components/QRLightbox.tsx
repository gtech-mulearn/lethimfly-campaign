'use client';

import { useState, useEffect } from 'react';

interface Props {
  src: string;
  alt?: string;
}

export default function QRLightbox({ src, alt = 'UPI QR Code' }: Props) {
  const [open, setOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Thumbnail - clickable */}
      <button
        type="button"
        className="qr-thumb-btn"
        onClick={() => setOpen(true)}
        aria-label="Enlarge QR code"
        title="Click to enlarge"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="payment-qr-img" />
        <span className="qr-thumb-hint">Tap to enlarge</span>
      </button>

      {/* Lightbox overlay */}
      {open && (
        <div
          className="qr-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="QR code enlarged view"
        >
          <div className="qr-lightbox" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="qr-lightbox-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="qr-lightbox-img" />
            <p className="qr-lightbox-label">Scan with any UPI app to pay</p>
          </div>
        </div>
      )}
    </>
  );
}
