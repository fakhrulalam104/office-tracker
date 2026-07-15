"use client";

import { useEffect, useRef, useState } from "react";
import { Card, buttonClass, softButtonClass } from "./shared";

type Session = { start: Date; duration: number; type: "work" | "break" };

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function PomodoroTimerTool() {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isWork, setIsWork] = useState(true);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date>(new Date());

  useEffect(() => {
    if (running) {
      startTimeRef.current = new Date();
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function handleTimerEnd() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);

    if (isWork) {
      const elapsed = workMinutes * 60;
      setSessions((prev) => [...prev, { start: startTimeRef.current, duration: elapsed, type: "work" }]);
      setSessionsCompleted((prev) => prev + 1);
      setTotalFocusTime((prev) => prev + elapsed);

      const nextSessions = sessionsCompleted + 1;
      if (nextSessions % 4 === 0) {
        setSecondsLeft(longBreakMinutes * 60);
      } else {
        setSecondsLeft(breakMinutes * 60);
      }
      setIsWork(false);
    } else {
      setSecondsLeft(workMinutes * 60);
      setIsWork(true);
    }
  }

  function start() {
    setRunning(true);
  }

  function pause() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function reset() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsWork(true);
    setSecondsLeft(workMinutes * 60);
  }

  const progress = isWork
    ? 1 - secondsLeft / (workMinutes * 60)
    : 1 - secondsLeft / ((sessionsCompleted % 4 === 0 ? longBreakMinutes : breakMinutes) * 60);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            {isWork ? "Focus Session" : "Break Time"}
          </p>
          <div className="relative mt-6 inline-flex items-center justify-center">
            <svg className="h-48 w-48 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={isWork ? "#0ea5e9" : "#10b981"} strokeWidth="6" strokeDasharray={`${progress * 283} 283`} strokeLinecap="round" />
            </svg>
            <span className="absolute font-mono text-4xl font-semibold tabular-nums text-slate-950">{formatTime(secondsLeft)}</span>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={running ? pause : start} className={buttonClass}>{running ? "Pause" : "Start"}</button>
            <button type="button" onClick={reset} className={softButtonClass}>Reset</button>
          </div>
          <p className="mt-4 text-sm text-slate-500">Session {sessionsCompleted % 4 + 1} of 4</p>
        </section>

        <div className="space-y-4">
          <Card title="Settings">
            <div className="space-y-3">
              <label className="block">
                <span className="flex justify-between text-sm font-semibold text-slate-700"><span>Work</span><span>{workMinutes}m</span></span>
                <input type="range" min={1} max={60} value={workMinutes} onChange={(e) => { setWorkMinutes(Number(e.target.value)); if (!running && isWork) setSecondsLeft(Number(e.target.value) * 60); }} className="mt-1 w-full accent-sky-600" />
              </label>
              <label className="block">
                <span className="flex justify-between text-sm font-semibold text-slate-700"><span>Break</span><span>{breakMinutes}m</span></span>
                <input type="range" min={1} max={30} value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))} className="mt-1 w-full accent-sky-600" />
              </label>
              <label className="block">
                <span className="flex justify-between text-sm font-semibold text-slate-700"><span>Long break</span><span>{longBreakMinutes}m</span></span>
                <input type="range" min={1} max={60} value={longBreakMinutes} onChange={(e) => setLongBreakMinutes(Number(e.target.value))} className="mt-1 w-full accent-sky-600" />
              </label>
            </div>
          </Card>
          <Card title="Stats">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-sky-50 p-3 text-center">
                <p className="text-2xl font-semibold text-sky-700">{sessionsCompleted}</p>
                <p className="text-xs text-slate-500">Sessions</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-semibold text-emerald-700">{Math.floor(totalFocusTime / 60)}m</p>
                <p className="text-xs text-slate-500">Focus time</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
