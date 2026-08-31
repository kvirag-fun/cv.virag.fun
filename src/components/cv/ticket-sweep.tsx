import { useEffect, useMemo, useRef, useState } from "react";
import { Ticket as TicketIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Krisztián's real best time — beat it.
const GHOST_MS = 14800;
const BEST_KEY = "ticket-sweep-best-ms";

type PriorityTier = "Critical" | "Major" | "Minor";

interface Ticket {
  id: string;
  priority: PriorityTier;
  assignee: string;
  isTarget: boolean;
}

interface RoundDef {
  seed: number;
  count: number;
  targetCount: number;
  mode: "priority" | "unassigned";
  showPriorityColor: boolean;
}

// count is a multiple of 8 (the desktop grid's column count) so the board
// comes out to an exact number of rows there: 3, then 4, then 5.
const ROUNDS: RoundDef[] = [
  { seed: 1001, count: 24, targetCount: 4, mode: "priority", showPriorityColor: true },
  { seed: 2002, count: 32, targetCount: 5, mode: "priority", showPriorityColor: false },
  { seed: 3003, count: 40, targetCount: 6, mode: "unassigned", showPriorityColor: false },
];

// Reuse the site's existing accent tokens instead of inventing new colors.
const PRIORITY_COLOR: Record<PriorityTier, string> = {
  Critical: "text-destructive",
  Major: "text-markup",
  Minor: "text-primary",
};
const DECOY_PRIORITY_POOL: PriorityTier[] = ["Major", "Minor"];
const ASSIGNEE_POOL = ["@kv", "@jsmith", "@anna", "@marek", "@dlee", "@nova"];

/** Deterministic PRNG so every round's board is identical across plays (needed for a future ghost-run replay to line up). */
function mulberry32(seed: number) {
  let s = seed;
  return function random() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledIndices(random: () => number, n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function generateBoard(round: RoundDef, gameSeed: number): Ticket[] {
  // XOR the round's base seed with a fresh per-game seed so ticket
  // positions differ every playthrough instead of being identical every time.
  const random = mulberry32(round.seed ^ gameSeed);
  const targetSlots = new Set(shuffledIndices(random, round.count).slice(0, round.targetCount));
  const tickets: Ticket[] = [];
  for (let i = 0; i < round.count; i++) {
    const id = `TCK-${1000 + Math.floor(random() * 9000)}`;
    const isTarget = targetSlots.has(i);
    if (round.mode === "priority") {
      tickets.push({
        id,
        priority: isTarget
          ? "Critical"
          : DECOY_PRIORITY_POOL[Math.floor(random() * DECOY_PRIORITY_POOL.length)]!,
        assignee: ASSIGNEE_POOL[Math.floor(random() * ASSIGNEE_POOL.length)]!,
        isTarget,
      });
    } else {
      tickets.push({
        id,
        priority: (["Critical", "Major", "Minor"] as const)[Math.floor(random() * 3)]!,
        assignee: isTarget
          ? "unassigned"
          : ASSIGNEE_POOL[Math.floor(random() * ASSIGNEE_POOL.length)]!,
        isTarget,
      });
    }
  }
  return tickets;
}

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

type Phase = "intro" | "playing" | "finished";

/** A timed 3-round "find the ticket" mini-game — the mini-game equivalent of the Sudoku/Tic-Tac-Toe hobby mentioned above. */
export function TicketSweep() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [roundIndex, setRoundIndex] = useState(0);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [flashId, setFlashId] = useState<string | null>(null);
  const [roundClear, setRoundClear] = useState(false);
  const [finalMs, setFinalMs] = useState<number | null>(null);
  const [bestMs, setBestMs] = useState<number | null>(null);
  const [gameSeed, setGameSeed] = useState(() => Date.now());
  const [, forceTick] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const penaltyMsRef = useRef(0);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BEST_KEY);
      if (stored) setBestMs(Number(stored));
    } catch {
      // Private browsing / storage disabled — just skip the best-time compare.
    }
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => forceTick((n) => n + 1), 100);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
    };
  }, []);

  const round = ROUNDS[roundIndex]!;
  const board = useMemo(() => generateBoard(round, gameSeed), [round, gameSeed]);

  const elapsedMs =
    phase === "finished" && finalMs !== null
      ? finalMs
      : startedAtRef.current !== null
        ? performance.now() - startedAtRef.current + penaltyMsRef.current
        : 0;

  function startGame() {
    setPhase("playing");
    setRoundIndex(0);
    setFound(new Set());
    setRoundClear(false);
    setFinalMs(null);
    setGameSeed(Date.now());
    penaltyMsRef.current = 0;
    startedAtRef.current = performance.now();
  }

  function handleTicketClick(ticket: Ticket) {
    if (phase !== "playing" || roundClear || found.has(ticket.id)) return;

    if (ticket.isTarget) {
      const next = new Set(found);
      next.add(ticket.id);
      setFound(next);
      if (next.size === round.targetCount) {
        setRoundClear(true);
        roundTimeoutRef.current = setTimeout(() => {
          if (roundIndex + 1 < ROUNDS.length) {
            setRoundIndex((r) => r + 1);
            setFound(new Set());
            setRoundClear(false);
          } else {
            const elapsed =
              performance.now() -
              (startedAtRef.current ?? performance.now()) +
              penaltyMsRef.current;
            setFinalMs(elapsed);
            setPhase("finished");
            setBestMs((prevBest) => {
              const best = prevBest === null || elapsed < prevBest ? elapsed : prevBest;
              try {
                localStorage.setItem(BEST_KEY, String(best));
              } catch {
                // Private browsing / storage disabled — the run still completes fine.
              }
              return best;
            });
          }
        }, 700);
      }
    } else {
      penaltyMsRef.current += 1000;
      setFlashId(ticket.id);
      flashTimeoutRef.current = setTimeout(() => setFlashId(null), 220);
    }
  }

  return (
    <div className="no-print mt-6">
      <div className="leader-line pb-4">
        <p className="section-heading-label flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-markup">
          <TicketIcon className="section-heading-icon h-3.5 w-3.5" aria-hidden="true" />
          bonus / ticket sweep
        </p>
      </div>

      <div className="mt-6 border border-dashed border-border bg-card/60 p-6 sm:p-8">
        {phase === "intro" && (
          <div>
            <p className="max-w-xl text-sm leading-relaxed text-foreground/85">
              Three rounds, one stopwatch. Click every ticket that matches the round&apos;s target
              before moving on — the boards get bigger and the tells get subtler each round. A wrong
              click costs a 1s penalty.
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 border border-border bg-background px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-primary transition-colors hover:border-primary"
            >
              Start
            </button>
            {bestMs !== null && (
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                Your best: {formatMs(bestMs)} · Beat my time: {formatMs(GHOST_MS)}
              </p>
            )}
          </div>
        )}

        {phase === "playing" && (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-primary">
                Round {roundIndex + 1} / {ROUNDS.length} · Find every{" "}
                {round.mode === "priority" ? (
                  <span className={round.showPriorityColor ? "text-destructive" : undefined}>
                    Critical
                  </span>
                ) : (
                  "unassigned"
                )}{" "}
                ticket
              </p>
              <div className="flex items-center gap-4 font-mono text-xs tracking-[0.1em] text-muted-foreground">
                <span>
                  {found.size} / {round.targetCount}
                </span>
                <span className="text-foreground">{formatMs(elapsedMs)}</span>
              </div>
            </div>

            {roundClear ? (
              <p className="mt-8 text-center font-mono text-sm uppercase tracking-[0.2em] text-markup">
                Round clear
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
                {board.map((ticket) => {
                  const isFound = found.has(ticket.id);
                  const isFlashing = flashId === ticket.id;
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => handleTicketClick(ticket)}
                      disabled={isFound}
                      className={cn(
                        "flex flex-col items-start gap-0.5 border px-1.5 py-1 text-left font-mono text-[9px] transition-colors",
                        isFound &&
                          "border-border bg-background text-muted-foreground/40 line-through",
                        isFlashing && "border-destructive bg-destructive/10 text-destructive",
                        !isFound &&
                          !isFlashing &&
                          "border-border bg-background text-foreground/85 hover:border-primary",
                      )}
                    >
                      <span>{ticket.id}</span>
                      {round.mode === "priority" ? (
                        <span
                          className={
                            round.showPriorityColor
                              ? PRIORITY_COLOR[ticket.priority]
                              : "text-muted-foreground"
                          }
                        >
                          {ticket.priority}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{ticket.assignee}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {phase === "finished" && finalMs !== null && (
          <div>
            <p className="font-mono text-2xl text-foreground">{formatMs(finalMs)}</p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              Your best: {formatMs(bestMs ?? finalMs)} · Beat my time: {formatMs(GHOST_MS)}
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-primary">
              {finalMs < GHOST_MS ? "You beat my time." : "Still chasing my time."}
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 border border-border bg-background px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-primary transition-colors hover:border-primary"
            >
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
