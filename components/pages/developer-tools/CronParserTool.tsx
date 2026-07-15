"use client";

import { useMemo, useState } from "react";
import { Card, OutputBox, inputClass } from "./shared";

function parseCronField(field: string, min: number, max: number): number[] {
  const values: number[] = [];
  const parts = field.split(",");

  for (const part of parts) {
    if (part === "*") {
      for (let i = min; i <= max; i++) values.push(i);
    } else if (part.includes("/")) {
      const [start, step] = part.split("/");
      const s = step ? parseInt(step, 10) : 1;
      const st = start === "*" ? min : parseInt(start, 10);
      for (let i = st; i <= max; i += s) values.push(i);
    } else if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      for (let i = a; i <= b; i++) values.push(i);
    } else {
      values.push(parseInt(part, 10));
    }
  }

  return [...new Set(values)].filter((v) => v >= min && v <= max).sort((a, b) => a - b);
}

function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid cron expression. Must have 5 fields.";

  const [min, hour, dom, month, dow] = parts;
  const descriptions: string[] = [];

  if (min === "*" && hour === "*") {
    descriptions.push("Every minute");
  } else if (min.startsWith("*/")) {
    descriptions.push(`Every ${min.slice(2)} minutes`);
  } else if (hour === "*") {
    descriptions.push(`At minute ${min}`);
  } else {
    descriptions.push(`At ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`);
  }

  if (dom !== "*") descriptions.push(`on day ${dom} of the month`);
  if (month !== "*") descriptions.push(`in month ${month}`);
  if (dow !== "*") {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayNums = dow.split(",").map(Number);
    descriptions.push(`on ${dayNums.map((d) => dayNames[d] ?? `day ${d}`).join(", ")}`);
  }

  return descriptions.join(", ");
}

function getNextFires(expr: string, count: number): string[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minField, hourField, domField, monthField, dowField] = parts;
  const minutes = parseCronField(minField, 0, 59);
  const hours = parseCronField(hourField, 0, 23);
  const days = parseCronField(domField, 1, 31);
  const months = parseCronField(monthField, 1, 12);
  const daysOfWeek = parseCronField(dowField, 0, 6);

  const fires: Date[] = [];
  const now = new Date();
  const candidate = new Date(now);
  candidate.setSeconds(0);
  candidate.setMilliseconds(0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  for (let dayOffset = 0; dayOffset < 400 && fires.length < count; dayOffset++) {
    const checkDate = new Date(candidate);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    checkDate.setMinutes(0);
    checkDate.setHours(0);

    if (!months.includes(checkDate.getMonth() + 1)) continue;
    if (!days.includes(checkDate.getDate())) continue;
    if (!daysOfWeek.includes(checkDate.getDay())) continue;

    for (const h of hours) {
      for (const m of minutes) {
        const fireTime = new Date(checkDate);
        fireTime.setHours(h, m, 0, 0);
        if (fireTime > now) fires.push(fireTime);
        if (fires.length >= count) break;
      }
      if (fires.length >= count) break;
    }
  }

  return fires.map((d) => d.toLocaleString());
}

export function CronParserTool() {
  const [expression, setExpression] = useState("*/15 * * * *");

  const description = useMemo(() => describeCron(expression), [expression]);
  const nextFires = useMemo(() => getNextFires(expression, 8), [expression]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Cron Expression">
        <input value={expression} onChange={(e) => setExpression(e.target.value)} className={inputClass} placeholder="*/15 * * * *" />
        <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs font-semibold text-slate-500">
          <span>Min</span><span>Hour</span><span>Day</span><span>Month</span><span>DOW</span>
        </div>
        <div className="mt-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">{description}</p>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Quick reference</p>
          <div className="mt-2 grid gap-1 font-mono text-xs text-slate-600">
            <span>* &nbsp;&nbsp; = every value</span>
            <span>*/5 = every 5 units</span>
            <span>1-5 = range</span>
            <span>1,3,5 = specific values</span>
            <span>0=Sun,1=Mon...6=Sat</span>
          </div>
        </div>
      </Card>
      <OutputBox value={nextFires.map((f, i) => `${i + 1}. ${f}`).join("\n")} label="Next 8 fire times" />
    </div>
  );
}
