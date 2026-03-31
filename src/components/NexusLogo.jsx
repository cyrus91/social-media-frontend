/**
 * Nexus Logo — SVG mark + wordmark
 * size: numero (default 32) per il mark SVG
 * showText: mostra il wordmark testuale
 * variant: "default" | "white" | "dark"
 */
function NexusLogo({ size = 32, showText = true, className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} style={{ lineHeight: 1 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        aria-label="Nexus logo mark">
        <defs>
          <linearGradient id="nx-lg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5B21B6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        {/* 4 connection nodes forming an N shape */}
        <circle cx="10" cy="46" r="5" fill="url(#nx-lg)" />
        <circle cx="10" cy="10" r="5" fill="#5B21B6" />
        <circle cx="46" cy="46" r="5" fill="#06B6D4" />
        <circle cx="46" cy="10" r="5" fill="url(#nx-lg)" />
        {/* N strokes */}
        <line x1="10" y1="46" x2="10" y2="10" stroke="#5B21B6" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="10" y1="10" x2="46" y2="46" stroke="url(#nx-lg)" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="46" y1="46" x2="46" y2="10" stroke="#06B6D4" strokeWidth="3.5" strokeLinecap="round" />
        {/* Central node */}
        <circle cx="28" cy="28" r="2.5" fill="white" opacity="0.6" />
      </svg>
      {showText && (
        <span className="nx-logo-text">Nexus</span>
      )}
    </div>
  );
}

export default NexusLogo;