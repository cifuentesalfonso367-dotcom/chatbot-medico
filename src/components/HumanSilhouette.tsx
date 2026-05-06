// Silueta de cuerpo humano SVG, decorativa, gira lentamente al fondo.
const HumanSilhouette = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
    <div className="absolute h-[120%] w-[120%] bg-gradient-glow animate-pulse-glow" />
    <svg
      viewBox="0 0 200 400"
      className="h-[90%] w-auto animate-spin-slow opacity-[0.07] dark:opacity-[0.12]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      {/* Head */}
      <circle cx="100" cy="40" r="25" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      {/* Neck */}
      <line x1="100" y1="65" x2="100" y2="80" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      {/* Torso */}
      <path d="M60 90 Q100 80 140 90 L135 220 Q100 230 65 220 Z" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      {/* Arms */}
      <path d="M60 90 Q40 140 35 200 Q33 230 40 250" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      <path d="M140 90 Q160 140 165 200 Q167 230 160 250" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      {/* Hands */}
      <circle cx="40" cy="255" r="6" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      <circle cx="160" cy="255" r="6" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      {/* Legs */}
      <path d="M75 220 Q70 300 72 380" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      <path d="M125 220 Q130 300 128 380" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      {/* Feet */}
      <ellipse cx="72" cy="385" rx="10" ry="4" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      <ellipse cx="128" cy="385" rx="10" ry="4" stroke="url(#bodyGrad)" strokeWidth="1.5" />
      {/* Inner energy lines */}
      <line x1="100" y1="80" x2="100" y2="220" stroke="url(#bodyGrad)" strokeWidth="0.8" strokeDasharray="3 4" />
      <circle cx="100" cy="120" r="3" fill="url(#bodyGrad)" />
      <circle cx="100" cy="160" r="3" fill="url(#bodyGrad)" />
      <circle cx="100" cy="200" r="3" fill="url(#bodyGrad)" />
    </svg>
  </div>
);

export default HumanSilhouette;
