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
    // IntersectionObserver's callback batching isn't reliable for fast
    // anchor-jump scrolls (a big instant scroll can skip straight past its
    // narrow "active" band without ever firing for the section landed on),
    // so compute the active section directly from scroll position instead —
    // the standard scrollspy approach: the last section whose top has
    // crossed a fixed trigger line is the active one.
    function updateActive() {
      const triggerY = window.innerHeight * 0.35;
      let currentId = sections[0]?.id ?? "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= triggerY) currentId = s.id;
      }

      // The last section can be shorter than the page's remaining scroll
      // room, so its top may never cross the trigger line (nowhere further
      // to scroll to). Force it active once scrolled to the very bottom.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) currentId = sections[sections.length - 1]?.id ?? currentId;

      setActive(currentId);
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
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
