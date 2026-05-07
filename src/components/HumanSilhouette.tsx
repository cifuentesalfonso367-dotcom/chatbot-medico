import { useEffect, useRef, useState } from "react";
import bodyImg from "@/assets/human-body.png";

interface HumanSilhouetteProps {
  mousePosition?: { x: number; y: number; active: boolean };
}

const HumanSilhouette = ({ mousePosition }: HumanSilhouetteProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [progress, setProgress] = useState(0);
  const mouse = mousePosition || { x: 50, y: 50, active: false };

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

  // Efecto para controlar la animación del filtro SVG
  useEffect(() => {
    const animateElement = svgRef.current?.querySelector('animate');
    if (animateElement) {
      if (mouse.active) {
        animateElement.setAttribute('to', '25');
        animateElement.beginElement();
      } else {
        animateElement.setAttribute('to', '0');
        animateElement.beginElement();
      }
    }
  }, [mouse.active]);

  // Reveal mask: descubre de arriba a abajo con scroll
  const revealMask = `linear-gradient(to bottom, hsl(0 0% 0%) 0%, hsl(0 0% 0%) 100%)`;

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <div className="pointer-events-none absolute h-[120%] w-[120%] bg-gradient-glow opacity-60" />

      <div
        className="relative h-full w-full max-w-md mx-auto transition-[opacity,transform] duration-700 ease-out"
        style={{
          opacity: 0.4 + progress * 0.3,
          transform: `scale(${0.95 + progress * 0.05})`,
        }}
      >
        {/* SVG con filtro de distorsión líquida que sigue al cursor */}
        <svg ref={svgRef} className="absolute h-0 w-0" aria-hidden="true">
          <defs>
            <filter id="liquid-distort" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015"
                numOctaves="3"
                seed="4"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
              >
                <animate
                  attributeName="scale"
                  dur="0.3s"
                  begin="indefinite"
                  fill="freeze"
                />
              </feDisplacementMap>
            </filter>
          </defs>
        </svg>

        <img
          ref={imgRef}
          src={bodyImg.src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={1024}
          height={1536}
          draggable={false}
          className="h-full w-full select-none object-contain transition-[filter] duration-300"
          style={{
            WebkitMaskImage: revealMask,
            maskImage: revealMask,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            filter: mouse.active ? "url(#liquid-distort) blur(1px) contrast(1.02)" : "contrast(1.05) saturate(1.02)",
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
