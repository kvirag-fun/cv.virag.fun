import { useEffect, useRef, useState } from "react";
import type { Skill } from "@/lib/cv-types";

/** Skill row with a bar that animates to its score when scrolled into view. */
export function SkillBar({ skill }: { skill: Skill }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="group">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-foreground">{skill.name}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          {skill.level}
        </span>
      </div>
      <div className="mt-2 h-[5px] w-full border border-border bg-secondary/60">
        <div
          className="h-full bg-primary transition-[width] duration-1000 ease-out group-hover:bg-markup"
          style={{
            width: visible ? `${skill.score}%` : "0%",
            transitionDelay: "150ms",
          }}
        />
      </div>
    </div>
  );
}
