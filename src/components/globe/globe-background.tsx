"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

interface GlobeBackgroundProps {
  className?: string;
  planetClassName?: string;
}

const DigitalGlobe = dynamic(
  () => import("@/components/globe/digital-globe").then((mod) => mod.DigitalGlobe),
  {
    ssr: false,
    loading: () => <StaticGradientPlanet />,
  }
);

function useClientMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function StaticGradientPlanet({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-[720px] rounded-full",
        "bg-[radial-gradient(circle_at_32%_28%,rgba(91,202,255,0.95),rgba(20,115,255,0.56)_28%,rgba(3,24,55,0.86)_58%,rgba(2,8,23,0.22)_74%,transparent_76%)]",
        "shadow-[0_0_90px_rgba(20,115,255,0.34),inset_-34px_-28px_70px_rgba(0,0,0,0.54)]",
        "before:absolute before:inset-[10%] before:rounded-full before:border before:border-[rgba(125,211,252,0.2)] before:bg-[linear-gradient(120deg,transparent_30%,rgba(34,211,238,0.12)_31%,transparent_34%,transparent_48%,rgba(20,115,255,0.14)_49%,transparent_53%)]",
        "after:absolute after:-inset-[8%] after:rounded-full after:bg-[radial-gradient(circle,rgba(34,211,238,0.2),transparent_66%)]",
        className
      )}
    />
  );
}

export function GlobeBackground({
  className,
  planetClassName,
}: GlobeBackgroundProps) {
  const isMobile = useClientMediaQuery("(max-width: 768px)");
  const reducedMotion = useClientMediaQuery("(prefers-reduced-motion: reduce)");
  const useFallback = isMobile !== false || reducedMotion !== false;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-[-18%] right-[-16%] z-0 flex w-[82vw] max-w-[980px] items-center justify-center opacity-[0.45]",
        "blur-[0.2px] [mask-image:radial-gradient(ellipse_at_center,black_42%,rgba(0,0,0,0.62)_68%,transparent_86%)]",
        "sm:right-[-10%] lg:right-[-6%]",
        className
      )}
    >
      {useFallback ? (
        <StaticGradientPlanet className={planetClassName} />
      ) : (
        <DigitalGlobe className={cn("h-full min-h-[520px] w-full", planetClassName)} />
      )}
    </div>
  );
}

export default GlobeBackground;
