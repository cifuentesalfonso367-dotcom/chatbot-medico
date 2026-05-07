import { useEffect, useRef, useState } from "react";
import bodyImg from "@/assets/human-body.png";

const HumanSilhouette = () => {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [progress, setProgress] = useState(0);
  const [mouse, setMouse] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = 1 - (rect.top + rect.height * 0.2) / vh;
      setProgress(Math.max(0, Math.min(1, raw)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMouse({ x, y, active: true });
  };

  // Reveal mask: descubre de arriba a abajo con scroll
  const revealMask = `linear-gradient(to bottom, hsl(0 0% 0%) 0%, hsl(0 0% 0%) 100%)`;

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      onMouseMove={handleMove}
      onMouseLeave={() => setMouse((m) => ({ ...m, active: false }))}
    >
      <div className="pointer-events-none absolute h-[120%] w-[120%] bg-gradient-glow opacity-60" />

      <div
        className="relative h-full aspect-[2/3] transition-[opacity,transform] duration-700 ease-out"
        style={{
          opacity: 0.55 + progress * 0.35,
          transform: `scale(${0.98 + progress * 0.03})`,
        }}
      >
        {/* SVG con filtro de distorsión líquida que sigue al cursor */}
        <svg className="absolute h-0 w-0" aria-hidden="true">
          <defs>
            <filter id="liquid-distort" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012"
                numOctaves="2"
                seed="4"
                result="noise"
              >
                <animate
                  attributeName="baseFrequency"
                  dur="14s"
                  values="0.010;0.018;0.010"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={mouse.active ? 40 : 0}
                xChannelSelector="R"
                yChannelSelector="G"
              >
                <animate
                  attributeName="scale"
                  dur="0.6s"
                  to={mouse.active ? "40" : "0"}
                  fill="freeze"
                />
              </feDisplacementMap>
            </filter>
          </defs>
        </svg>

        <img
          ref={imgRef}
          src={bodyImg}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={1024}
          height={1536}
          draggable={false}
          className="h-full w-full select-none object-contain transition-[filter] duration-500"
          style={{
            WebkitMaskImage: revealMask,
            maskImage: revealMask,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            filter: mouse.active ? "url(#liquid-distort) blur(2px) contrast(1.05)" : "contrast(1.08) saturate(1.05)",
          }}
        />

        {/* Halo radial que sigue al cursor cuando está activo */}
        {mouse.active && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 180px at ${mouse.x}% ${mouse.y}%, hsl(var(--primary) / 0.35), transparent 70%)`,
              mixBlendMode: "screen",
            }}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-card/40 via-transparent to-card/60" />
    </div>
  );
};

export default HumanSilhouette;
