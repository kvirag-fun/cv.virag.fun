import { Reveal } from "@/components/cv/reveal";

interface SectionHeadingProps {
  index: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

/** "01 / PROFILE"-style heading with a dashed leader-line beneath it. */
export function SectionHeading({ index, icon: Icon, title }: SectionHeadingProps) {
  return (
    <Reveal>
      <div className="leader-line pb-4">
        <p className="section-heading-label flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-markup">
          <Icon className="section-heading-icon h-3.5 w-3.5" aria-hidden="true" />
          {index} / {title}
        </p>
      </div>
    </Reveal>
  );
}
