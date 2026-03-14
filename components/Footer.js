import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--accent-primary)', color: '#000', paddingTop: 'var(--space-12)', position: 'relative', overflow: 'hidden' }}>
      <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: 'var(--space-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-8)' }}>
          
          {/* Contact */}
          <div>
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <a href="mailto:skillhac@gmail.com" style={{ color: '#000', textDecoration: 'underline', fontWeight: 500, fontSize: 'var(--text-sm)' }}>skillhac@gmail.com</a>
              <a href="tel:+917907424988" style={{ color: '#000', textDecoration: 'underline', fontWeight: 500, fontSize: 'var(--text-sm)' }}>+91 79074 24988</a>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Address</h4>
            <div style={{ display: 'flex', flexDirection: 'column', color: '#000', fontWeight: 500, lineHeight: 1.4, fontSize: 'var(--text-sm)' }}>
              <span>Sandhya Bhavan</span>
              <span>Moongode PO, Peyad</span>
              <span>Thiruvananthapuram</span>
              <span>Kerala - 695573</span>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Social</h4>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <a href="#" style={{ color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" style={{ color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="YouTube">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                 </svg>
              </a>
              <a href="#" style={{ color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="WhatsApp">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766 0 1.018.265 2.012.768 2.888l-.816 2.981 3.051-.801c.854.457 1.821.698 2.765.698 3.181 0 5.768-2.586 5.769-5.766 0-3.181-2.587-5.766-5.769-5.766zm3.435 8.019c-.188.528-1.077 1.014-1.503 1.066-.376.046-.867.098-1.472-.102-.321-.106-.757-.263-1.282-.544-2.228-1.196-3.639-3.486-3.748-3.632-.109-.146-.895-1.192-.895-2.273 0-1.082.565-1.614.764-1.825.201-.212.438-.266.584-.266.146 0 .292 0 .419.007.134.007.315-.05.483.355.178.428.608 1.485.663 1.595.055.111.091.242.018.388-.073.146-.109.238-.219.349-.109.111-.228.245-.327.329-.111.096-.228.204-.103.421.125.216.556.919 1.193 1.485.819.728 1.506.953 1.716 1.049.21.096.333.08.455-.059.123-.139.531-.617.677-.828.146-.212.292-.176.483-.104.192.071 1.213.57 1.423.676.21.106.351.159.401.248.051.089.051.517-.137 1.045z"/>
                 </svg>
              </a>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Huge Name at Bottom */}
      <div style={{ width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
        <h1 style={{ 
          fontSize: 'clamp(6rem, 15vw, 18rem)', 
          fontWeight: 900, 
          color: '#000', 
          lineHeight: 0.72, 
          margin: 0, 
          whiteSpace: 'nowrap',
          letterSpacing: '-0.02em',
          transform: 'translateY(12%)'
        }}>
          Syam Kumar
        </h1>
      </div>
    </footer>
  );
}
