"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Lap = {
  id: number;
  elapsedMs: number;
};

function formatElapsed(ms: number) {
  const totalCentiseconds = Math.floor(ms / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":")
    .concat(`.${centiseconds.toString().padStart(2, "0")}`);
}

export function StopwatchPageClient() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shellRef = useRef<HTMLElement | null>(null);
  const startedAtRef = useRef(0);
  const elapsedBeforeRunRef = useRef(0);
  const nextLapIdRef = useRef(1);

  useEffect(() => {
    if (!running) {
      return;
    }

    startedAtRef.current = performance.now();
    const interval = window.setInterval(() => {
      setElapsedMs(elapsedBeforeRunRef.current + performance.now() - startedAtRef.current);
    }, 25);

    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function start() {
    if (running) {
      return;
    }

    elapsedBeforeRunRef.current = elapsedMs;
    setRunning(true);
  }

  function pause() {
    if (!running) {
      return;
    }

    const currentElapsed = elapsedBeforeRunRef.current + performance.now() - startedAtRef.current;
    elapsedBeforeRunRef.current = currentElapsed;
    setElapsedMs(currentElapsed);
    setRunning(false);
  }

  function reset() {
    elapsedBeforeRunRef.current = 0;
    startedAtRef.current = performance.now();
    setElapsedMs(0);
    setLaps([]);
  }

  function recordLap() {
    setLaps((current) => [{ id: nextLapIdRef.current++, elapsedMs }, ...current]);
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await shellRef.current?.requestFullscreen();
  }

  return (
    <section
      ref={shellRef}
      className={`flex min-h-screen items-center justify-center px-4 py-6 transition-colors ${
        isFullscreen ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950"
      }`}
    >
      <div className="w-full max-w-[720px]">
        <div className={`mb-5 flex items-center justify-between gap-3 ${isFullscreen ? "text-slate-200" : "text-slate-600"}`}>
          <Link href="/features" className="text-sm font-semibold transition hover:text-sky-600">
            Back to features
          </Link>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isFullscreen
                ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300"
            }`}
          >
            {isFullscreen ? "Exit full screen" : "Full screen"}
          </button>
        </div>

        <div
          className={`rounded-3xl border p-6 text-center shadow-sm sm:p-8 ${
            isFullscreen ? "border-white/10 bg-white/10 shadow-none" : "border-slate-200 bg-white"
          }`}
        >
          <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${isFullscreen ? "text-slate-300" : "text-slate-500"}`}>Stopwatch</p>
          <div className="mt-5 font-mono text-5xl font-semibold tabular-nums tracking-normal text-current sm:text-7xl">
            {formatElapsed(elapsedMs)}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={running ? pause : start}
              className="min-w-28 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              {running ? "Pause" : "Start"}
            </button>
            <button
              type="button"
              onClick={recordLap}
              disabled={elapsedMs === 0}
              className={`min-w-28 rounded-full border px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                isFullscreen ? "border-white/15 bg-white/10 text-white hover:bg-white/15" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Lap
            </button>
            <button
              type="button"
              onClick={reset}
              className={`min-w-28 rounded-full border px-5 py-3 text-sm font-semibold transition ${
                isFullscreen ? "border-white/15 bg-transparent text-white hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Reset
            </button>
          </div>
        </div>

        {laps.length > 0 ? (
          <div className={`mt-5 overflow-hidden rounded-3xl border ${isFullscreen ? "border-white/10 bg-white/10" : "border-slate-200 bg-white"}`}>
            <div className={`grid grid-cols-[80px_1fr] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] ${isFullscreen ? "text-slate-300" : "text-slate-500"}`}>
              <span>Lap</span>
              <span className="text-right">Time</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {laps.map((lap, index) => (
                <div
                  key={lap.id}
                  className={`grid grid-cols-[80px_1fr] px-5 py-3 text-sm font-semibold ${
                    isFullscreen ? "border-t border-white/10 text-white" : "border-t border-slate-100 text-slate-800"
                  }`}
                >
                  <span>#{laps.length - index}</span>
                  <span className="text-right font-mono tabular-nums">{formatElapsed(lap.elapsedMs)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
