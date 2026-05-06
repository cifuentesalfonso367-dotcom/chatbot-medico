import bodyImg from "@/assets/human-body.png";

const HumanSilhouette = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
    <div className="absolute h-[120%] w-[120%] bg-gradient-glow animate-pulse-glow" />
    <div className="relative h-[90%] aspect-square" style={{ perspective: "1200px" }}>
      <img
        src={bodyImg}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1024}
        height={1024}
        className="h-full w-full object-contain opacity-30 dark:opacity-50 animate-rotate-y"
        style={{ transformStyle: "preserve-3d", backfaceVisibility: "visible" }}
      />
    </div>
  </div>
);

export default HumanSilhouette;
