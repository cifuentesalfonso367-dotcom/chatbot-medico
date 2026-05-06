import bodyImg from "@/assets/human-body.png";

const HumanSilhouette = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
    <div className="absolute h-[120%] w-[120%] bg-gradient-glow animate-pulse-glow" />
    <div className="relative h-[95%] aspect-[2/3]" style={{ perspective: "1400px" }}>
      <img
        src={bodyImg}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1024}
        height={1536}
        className="h-full w-full object-contain opacity-40 dark:opacity-55 animate-rotate-y"
        style={{ transformStyle: "preserve-3d", backfaceVisibility: "visible" }}
      />
    </div>
  </div>
);

export default HumanSilhouette;
