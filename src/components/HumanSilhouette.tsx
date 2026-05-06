import { useEffect, useRef, useState } from "react";
import bodyImg from "@/assets/human-body.png";

const HumanSilhouette = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 cuando aún no entra, 1 cuando ya pasó completo
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

  // Reveal effect: gradient mask que va descubriendo de arriba a abajo
  const revealPct = 10 + progress * 95;
  const maskImage = `linear-gradient(to bottom, hsl(0 0% 0% / 1) 0%, hsl(0 0% 0% / 1) ${revealPct}%, hsl(0 0% 0% / 0) ${Math.min(100, revealPct + 8)}%)`;

  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute inset-0 flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* halo suave */}
      <div className="pointer-events-none absolute h-[120%] w-[120%] bg-gradient-glow opacity-60" />

      <div
        className="relative h-[100%] aspect-[2/3] transition-[filter,opacity,transform] duration-700 ease-out"
        style={{
          filter: hover
            ? "blur(14px) saturate(0.9)"
            : "blur(0px) saturate(1)",
          opacity: 0.15 + progress * 0.55,
          transform: `translateY(${(1 - progress) * 30}px) scale(${0.96 + progress * 0.04})`,
        }}
      >
        <img
          src={bodyImg}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={1024}
          height={1536}
          draggable={false}
          className="h-full w-full select-none object-contain"
          style={{
            WebkitMaskImage: maskImage,
            maskImage,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            mixBlendMode: "multiply",
          }}
        />
      </div>

      {/* viñeta para integrarlo con el card */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-card/40 via-transparent to-card/60" />
    </div>
  );
};

export default HumanSilhouette;
