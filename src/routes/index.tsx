import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  MapPin,
  Mail,
  Phone,
  Cake,
  IdCard,
  BriefcaseBusiness,
  Wrench,
  GraduationCap,
  Gamepad2,
  Car,
  Lock,
  Printer,
  ArrowUpRight,
  Linkedin,
} from "lucide-react";
import { clearUnlocked, loadUnlocked, IS_OPEN, type UnlockedCv } from "@/lib/crypto";
import type { CvData } from "@/lib/cv-types";
import { Reveal } from "@/components/cv/reveal";
import { SectionHeading } from "@/components/cv/section-heading";
import { SideNav, type NavSection } from "@/components/cv/side-nav";
import { UnlockScreen } from "@/components/cv/unlock-screen";
import { SkillBar } from "@/components/cv/skill-bar";
import { TicketSweep } from "@/components/cv/ticket-sweep";
import { cn } from "@/lib/utils";

// The CV ships only as AES-GCM ciphertext (src/lib/cv-payload.ts). This page
// renders nothing until the payload is decrypted client-side; locked visitors
// are sent to /unlock. head() stays generic on purpose — this is private.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Curriculum Vitae — Private" },
      { name: "description", content: "A private curriculum vitae, shared by passphrase." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Curriculum Vitae — Private" },
      { property: "og:description", content: "A private curriculum vitae, shared by passphrase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CvPage,
});

const SECTIONS: NavSection[] = [
  { id: "profile", index: "01", label: "Profile" },
  { id: "experience", index: "02", label: "Experience" },
  { id: "skills", index: "03", label: "Skills" },
  { id: "education", index: "04", label: "Education" },
  { id: "beyond", index: "05", label: "Beyond work" },
];

const ASCII_ART_URL = "https://img-to-text.virag.fun";

function CvPage() {
  const [unlocked, setUnlocked] = useState<UnlockedCv | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Even in open mode the passphrase screen is shown first (with a Continue
    // button instead of an input), so the gate stays part of the experience.
    setUnlocked(loadUnlocked());
    setChecked(true);
  }, []);

  function onLock() {
    clearUnlocked();
    setUnlocked(null);
  }

  // SSR pass: neutral placeholder until the browser has checked the session.
  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Verifying access…
        </p>
      </div>
    );
  }

  // Locked visitors get the passphrase screen inline — no navigation, so it
  // works on any static host, including sub-path GitHub Pages sites.
  if (!unlocked) {
    return <UnlockScreen onUnlocked={setUnlocked} />;
  }

  const { cv, portraitDataUrl } = unlocked;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 bg-blueprint-grid" aria-hidden="true" />

      <SideNav sections={SECTIONS} />

      {/* Top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          {cv.name}
        </span>
        <div className="flex items-center gap-2">
          <IconButton
            icon={Printer}
            label="Print"
            title="Print this page"
            onClick={() => window.print()}
            hoverClassName="hover:border-primary hover:text-primary"
            compact
          />
          {!IS_OPEN && (
            <IconButton
              icon={Lock}
              label="Lock"
              title="Lock this page"
              onClick={onLock}
              hoverClassName="hover:border-markup hover:text-markup"
              compact
            />
          )}
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <Hero cv={cv} portraitUrl={portraitDataUrl} />
        <Experience cv={cv} />
        <Skills cv={cv} />
        <Education cv={cv} />
        <Beyond cv={cv} />

        <footer className="mt-20 border-t border-border pt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {cv.name} · {cv.title} · {cv.location} · {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  );
}

function IconButton({
  icon: Icon,
  label,
  title,
  onClick,
  hoverClassName,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  onClick: () => void;
  hoverClassName: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center gap-2 border border-border bg-card font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors",
        hoverClassName,
        compact ? "px-2.5 py-1.5" : "px-3 py-2",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

// The img-to-text.virag.fun mark: two drafting corner-ticks framing the "#"
// from that app's own ASCII ramp. Brackets stay markup-orange (the fixed
// brand accent); the glyph rides currentColor so it recolors on hover
// alongside the label, matching IconButton's other icons.
function AsciiArtMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className}>
      <g stroke="var(--markup)" strokeWidth={2.4} fill="none">
        <path d="M2,12 V2 H12" />
        <path d="M20,30 H30 V20" />
      </g>
      <text
        x="16"
        y="24"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontWeight={700}
        fontSize={24}
        fill="currentColor"
      >
        #
      </text>
    </svg>
  );
}

function Hero({ cv, portraitUrl }: { cv: CvData; portraitUrl: string }) {
  return (
    <section id="profile" className="scroll-mt-24 pt-14 sm:pt-20">
      <SectionHeading index="01" icon={IdCard} title="Profile" />

      <div className="mt-10 grid gap-10 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <Reveal delay={80}>
            <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-6xl">
              {cv.name}
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-4 flex items-center gap-3 font-mono text-sm uppercase tracking-[0.25em] text-primary">
              <span className="inline-block h-px w-8 bg-markup" aria-hidden="true" />
              {cv.title}
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p className="hero-tagline mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {cv.tagline}
            </p>
          </Reveal>

          <Reveal delay={260}>
            <ul className="mt-8 flex flex-wrap gap-2">
              <ContactChip icon={Mail} label={cv.email} href={`mailto:${cv.email}`} />
              <ContactChip
                icon={Phone}
                label={cv.phone}
                href={`tel:${cv.phone.replace(/\s/g, "")}`}
              />
              <ContactChip icon={MapPin} label={cv.location} />
              <ContactChip icon={Cake} label={cv.birthDate} />
              {cv.linkedin && (
                <ContactChip icon={Linkedin} label="LinkedIn" href={cv.linkedin} external />
              )}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={180} className="justify-self-center sm:justify-self-end">
          <figure className="corner-ticks p-3">
            <img
              src={portraitUrl}
              alt={`Portrait of ${cv.name}`}
              width={220}
              height={220}
              className="h-44 w-44 border border-border object-cover sm:h-56 sm:w-56"
            />
            <figcaption className="no-print mt-2 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              fig. 01 — the author
            </figcaption>
          </figure>
        </Reveal>
      </div>

      <div className="mt-10 space-y-4">
        {cv.about.map((paragraph, i) => (
          <Reveal key={i} delay={100 + i * 80}>
            <p className="max-w-2xl text-base leading-relaxed text-foreground/85">{paragraph}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ContactChip({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  external?: boolean;
}) {
  const className =
    "flex items-center gap-2 border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary";
  const content = (
    <>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
      {href && <ArrowUpRight className="h-3 w-3 opacity-50" aria-hidden="true" />}
    </>
  );
  return (
    <li>
      {href ? (
        <a
          href={href}
          className={className}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {content}
        </a>
      ) : (
        <span className={className}>{content}</span>
      )}
    </li>
  );
}

function Experience({ cv }: { cv: CvData }) {
  return (
    <section id="experience" className="mt-24 scroll-mt-24">
      <SectionHeading index="02" icon={BriefcaseBusiness} title="Work experience" />

      <ol className="mt-10 space-y-0">
        {cv.experience.map((job, i) => (
          <Reveal key={job.role + job.period} delay={i * 60}>
            <li className="relative border-l-2 border-border pb-12 pl-8 last:pb-0">
              <span
                className={cn(
                  "absolute top-1 -left-[7px] h-3 w-3 rounded-full border-2",
                  job.current ? "border-markup bg-markup" : "border-primary bg-background",
                )}
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="font-display text-2xl font-semibold text-foreground">
                  {job.role}
                  {job.current && (
                    <span className="ml-3 inline-block translate-y-[-2px] border border-markup bg-markup-soft px-2 py-0.5 align-middle font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-markup">
                      Current
                    </span>
                  )}
                </h3>
                <p className="font-mono text-xs tracking-[0.1em] text-muted-foreground">
                  {job.period}
                </p>
              </div>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-primary">
                {job.company} · {job.location}
              </p>
              <ul className="mt-4 space-y-2.5">
                {job.bullets.map((bullet, j) => (
                  <li key={j} className="flex gap-3 text-sm leading-relaxed text-foreground/85">
                    <span className="mt-[9px] h-px w-4 shrink-0 bg-markup" aria-hidden="true" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Skills({ cv }: { cv: CvData }) {
  return (
    <section id="skills" className="mt-24 scroll-mt-24">
      <SectionHeading index="03" icon={Wrench} title="Skills & languages" />

      <div className="mt-10 grid gap-12 sm:grid-cols-2">
        <Reveal>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Toolbox
          </h3>
          <div className="mt-6 space-y-6">
            {cv.skills.map((skill) => (
              <SkillBar key={skill.name} skill={skill} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Languages
          </h3>
          <ul className="mt-6 space-y-3">
            {cv.languages.map((lang) => (
              <li
                key={lang.name}
                className="flex items-center justify-between border border-border bg-card px-4 py-3 transition-colors hover:border-primary"
              >
                <span className="text-sm font-medium text-foreground">{lang.name}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-primary">
                  {lang.level}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-3 border border-dashed border-border bg-card/60 px-4 py-3">
            <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">
              Driving license{" "}
              <span className="font-mono font-medium text-foreground">{cv.drivingLicense}</span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Education({ cv }: { cv: CvData }) {
  return (
    <section id="education" className="mt-24 scroll-mt-24">
      <SectionHeading index="04" icon={GraduationCap} title="Education" />

      <ol className="mt-10 space-y-6">
        {cv.education.map((edu, i) => (
          <Reveal key={edu.field + edu.period} delay={i * 60}>
            <li className="group relative border border-border bg-card p-6 transition-colors hover:border-primary">
              <div
                className="corner-ticks pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
              <h3 className="font-display text-xl font-semibold text-foreground">{edu.field}</h3>
              <p className="mt-1 font-mono text-xs tracking-[0.1em] text-muted-foreground">
                {edu.period}
              </p>
              <p className="mt-2 text-sm text-foreground/85">{edu.school}</p>
              {edu.note && (
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-primary">
                  {edu.note}
                </p>
              )}
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                {edu.location}
              </p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Beyond({ cv }: { cv: CvData }) {
  return (
    <section id="beyond" className="mt-24 scroll-mt-24">
      <SectionHeading index="05" icon={Gamepad2} title="Beyond work" />

      <Reveal>
        <div className="mt-10 border border-border bg-card p-6 sm:p-8">
          <p className="max-w-2xl text-base leading-relaxed text-foreground/85">{cv.interests}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {cv.interestTags.map((tag) => (
              <li
                key={tag}
                className="border border-border bg-blueprint-soft px-3 py-1 font-mono text-[11px] uppercase tracking-[0.15em] text-primary"
              >
                {tag}
              </li>
            ))}
            <li>
              <a
                href={ASCII_ART_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Open the image-to-ASCII tool"
                className="flex items-center gap-2 border border-border bg-card px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <AsciiArtMark className="h-3.5 w-3.5" />
                ASCII Art
              </a>
            </li>
          </ul>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <TicketSweep />
      </Reveal>
    </section>
  );
}
