import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface NavSection {
  id: string;
  index: string;
  label: string;
}

interface SideNavProps {
  sections: NavSection[];
}

/** Fixed left rail with section links; highlights the section in view. */
export function SideNav({ sections }: SideNavProps) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Sections"
      className="no-print fixed top-1/2 left-6 z-20 hidden -translate-y-1/2 xl:block"
    >
      <ul className="space-y-5">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? "true" : undefined}
                className="group flex items-center gap-3"
              >
                <span
                  className={cn(
                    "font-mono text-[10px] tracking-widest transition-colors",
                    isActive ? "text-markup" : "text-muted-foreground/60 group-hover:text-foreground",
                  )}
                >
                  {s.index}
                </span>
                <span
                  className={cn(
                    "h-px transition-all duration-300",
                    isActive ? "w-10 bg-markup" : "w-5 bg-border group-hover:w-8 group-hover:bg-foreground/40",
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-[11px] uppercase tracking-[0.2em] transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground/60 group-hover:text-foreground",
                  )}
                >
                  {s.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
