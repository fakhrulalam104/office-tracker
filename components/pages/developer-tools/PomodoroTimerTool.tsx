"use client";

import { useEffect, useRef, useState, useId } from "react";
import { Card, buttonClass, softButtonClass } from "./shared";

type ThemeType = "tree" | "skyscraper" | "rocket" | "coffee";
type Session = { start: Date; duration: number; type: "work" | "break"; theme: ThemeType };

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Gentle Web Audio API chime
function playCompletionChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.65);
    });
  } catch {
    // audio fallback
  }
}

/* -------------------------------------------------------------------------- */
/*                               THEME 1: TREE                                */
/* -------------------------------------------------------------------------- */
function TreeVisual({ progress }: { progress: number }) {
  // 5 stages: 0-0.2 (Seedling), 0.2-0.45 (Young Sapling), 0.45-0.75 (Growing Tree), 0.75-0.95 (Full Canopy), 0.95-1.0 (Blooming)
  const isBloom = progress >= 0.95;
  const isFull = progress >= 0.75;
  const isBranches = progress >= 0.45;
  const isSapling = progress >= 0.2;

  return (
    <svg viewBox="0 0 320 280" className="h-full w-full select-none" aria-label="Growing Tree">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#f0fdf4" />
        </linearGradient>
        <linearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="canopyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background Sky & Sun */}
      <rect width="320" height="280" rx="24" fill="url(#skyGrad)" />
      <circle cx="260" cy="50" r="30" fill="url(#sunGlow)" />
      <circle cx="260" cy="50" r="16" fill="#facc15" />

      {/* Sun rays animation when bloom */}
      {isBloom && (
        <g className="animate-spin" style={{ transformOrigin: "260px 50px", animationDuration: "20s" }}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="260"
              y1="25"
              x2="260"
              y2="18"
              stroke="#eab308"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${angle} 260 50)`}
            />
          ))}
        </g>
      )}

      {/* Soft Clouds */}
      <g opacity="0.75">
        <path d="M 40 45 Q 50 35 65 40 Q 80 32 95 42 Q 105 45 100 55 Q 95 62 40 60 Z" fill="#ffffff" />
        <path d="M 170 70 Q 180 60 195 65 Q 210 58 225 68 Q 235 72 230 80 Q 225 88 170 85 Z" fill="#ffffff" />
      </g>

      {/* Grass Ground Hill */}
      <path d="M -10 240 Q 80 215 160 220 Q 240 225 330 240 L 330 290 L -10 290 Z" fill="url(#hillGrad)" />
      <path d="M -10 255 Q 160 238 330 255 L 330 290 L -10 290 Z" fill="#15803d" opacity="0.4" />

      {/* Soil Mound */}
      <ellipse cx="160" cy="235" rx="26" ry="6" fill="#78350f" opacity="0.3" />

      {/* STAGE 0: Sprout (0 to 0.2) */}
      {!isSapling && (
        <g style={{ transform: `scale(${Math.max(0.4, progress * 4.5)})`, transformOrigin: "160px 235px" }}>
          {/* Sprout stem */}
          <path d="M 160 235 Q 158 220 160 212" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
          {/* Tiny Leaves */}
          <path d="M 160 215 Q 148 210 152 205 Q 158 212 160 215 Z" fill="#4ade80" />
          <path d="M 160 212 Q 172 207 168 202 Q 162 209 160 212 Z" fill="#22c55e" />
        </g>
      )}

      {/* STAGE 1+: Trunk */}
      {isSapling && (
        <g>
          {/* Trunk with dynamic height scale */}
          <path
            d="M 152 235 Q 155 190 156 150 Q 158 120 160 90 L 164 90 Q 166 120 168 150 Q 169 190 172 235 Z"
            fill="url(#trunkGrad)"
            style={{
              transform: `scaleY(${Math.min(1, 0.4 + progress * 0.65)})`,
              transformOrigin: "160px 235px",
              transition: "transform 0.5s ease-out",
            }}
          />

          {/* Branches */}
          {isBranches && (
            <g style={{ opacity: Math.min(1, (progress - 0.45) * 4), transition: "opacity 0.5s" }}>
              <path d="M 157 150 Q 135 130 115 125" fill="none" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
              <path d="M 167 140 Q 190 120 210 118" fill="none" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
              <path d="M 158 115 Q 140 95 128 85" fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
              <path d="M 164 105 Q 185 85 198 78" fill="none" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}

          {/* Canopy Clouds */}
          {isBranches && (
            <g
              style={{
                transform: `scale(${Math.min(1, (progress - 0.4) * 1.8)})`,
                transformOrigin: "160px 100px",
                transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {/* Back / Shadow Canopy */}
              <circle cx="120" cy="115" r="32" fill="#15803d" />
              <circle cx="205" cy="110" r="30" fill="#15803d" />
              <circle cx="160" cy="70" r="38" fill="#166534" />

              {/* Main Lush Canopy */}
              <circle cx="125" cy="110" r="28" fill="url(#canopyGrad)" />
              <circle cx="198" cy="105" r="27" fill="url(#canopyGrad)" />
              <circle cx="140" cy="80" r="32" fill="url(#canopyGrad)" />
              <circle cx="180" cy="75" r="30" fill="url(#canopyGrad)" />
              <circle cx="160" cy="62" r="32" fill="url(#canopyGrad)" />

              {/* Highlight Canopy leaves */}
              {isFull && (
                <g>
                  <circle cx="150" cy="55" r="16" fill="#86efac" opacity="0.6" />
                  <circle cx="120" cy="100" r="14" fill="#86efac" opacity="0.5" />
                  <circle cx="190" cy="95" r="13" fill="#86efac" opacity="0.5" />
                  {/* Small red berries */}
                  <circle cx="130" cy="120" r="3.5" fill="#ef4444" />
                  <circle cx="155" cy="85" r="3.5" fill="#ef4444" />
                  <circle cx="185" cy="112" r="3.5" fill="#ef4444" />
                  <circle cx="170" cy="65" r="3.5" fill="#ef4444" />
                </g>
              )}
            </g>
          )}

          {/* Blooming Flowers & Butterflies (Stage 4) */}
          {isBloom && (
            <g className="animate-pulse" style={{ animationDuration: "2.5s" }}>
              {/* Pink Blossom 1 */}
              <g transform="translate(115, 95)">
                <circle cx="0" cy="-4" r="3" fill="#f472b6" />
                <circle cx="4" cy="0" r="3" fill="#f472b6" />
                <circle cx="0" cy="4" r="3" fill="#f472b6" />
                <circle cx="-4" cy="0" r="3" fill="#f472b6" />
                <circle cx="0" cy="0" r="2" fill="#fef08a" />
              </g>
              {/* Pink Blossom 2 */}
              <g transform="translate(195, 85)">
                <circle cx="0" cy="-4" r="3" fill="#f472b6" />
                <circle cx="4" cy="0" r="3" fill="#f472b6" />
                <circle cx="0" cy="4" r="3" fill="#f472b6" />
                <circle cx="-4" cy="0" r="3" fill="#f472b6" />
                <circle cx="0" cy="0" r="2" fill="#fef08a" />
              </g>
              {/* Pink Blossom 3 */}
              <g transform="translate(160, 45)">
                <circle cx="0" cy="-4" r="3.5" fill="#fb7185" />
                <circle cx="4" cy="0" r="3.5" fill="#fb7185" />
                <circle cx="0" cy="4" r="3.5" fill="#fb7185" />
                <circle cx="-4" cy="0" r="3.5" fill="#fb7185" />
                <circle cx="0" cy="0" r="2" fill="#fef08a" />
              </g>
              {/* Fluttering Butterfly */}
              <g transform="translate(85, 80)">
                <path d="M 0 0 Q -8 -10 -4 -15 Q 0 -10 0 0 Q 8 -10 4 -15 Q 0 -10 0 0" fill="#a855f7" />
                <circle cx="0" cy="-5" r="1.5" fill="#581c87" />
              </g>
            </g>
          )}
        </g>
      )}

      {/* Floating Sparkles when complete */}
      {isBloom && (
        <g>
          <text x="65" y="150" fontSize="16">✨</text>
          <text x="235" y="140" fontSize="14">🌸</text>
          <text x="148" y="30" fontSize="18">🌟</text>
        </g>
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                            THEME 2: SKYSCRAPER                             */
/* -------------------------------------------------------------------------- */
function SkyscraperVisual({ progress }: { progress: number }) {
  // 5 stages:
  // 0-0.2: Foundation & Crane
  // 0.2-0.45: Lower steel skeleton & first 2 floors
  // 0.45-0.7: Middle tower & glowing windows
  // 0.7-0.9: Upper penthouse & rooftop spire
  // 0.9-1.0: Fireworks & fully illuminated
  const isComplete = progress >= 0.95;
  const isSpire = progress >= 0.7;
  const isMid = progress >= 0.45;
  const isLower = progress >= 0.2;

  // Number of active illuminated floors (up to 7)
  const floorCount = Math.floor(progress * 7);

  return (
    <svg viewBox="0 0 320 280" className="h-full w-full select-none" aria-label="Building Skyscraper">
      <defs>
        <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="60%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        <linearGradient id="buildingGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="35%" stopColor="#334155" />
          <stop offset="70%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="craneGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Night Sky Background */}
      <rect width="320" height="280" rx="24" fill="url(#nightSky)" />

      {/* Background Stars */}
      {[
        [30, 30], [80, 20], [130, 45], [190, 25], [280, 40], [295, 75],
        [45, 80], [70, 110], [250, 110], [290, 130]
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 1.5 : 1} fill="#ffffff" opacity={0.6} />
      ))}

      {/* Moon */}
      <circle cx="50" cy="45" r="16" fill="#fef08a" opacity="0.9" />
      <circle cx="56" cy="42" r="14" fill="#0f172a" />

      {/* Distant City Skyline Silhouettes */}
      <path d="M 0 250 L 25 250 L 25 200 L 45 200 L 45 250 L 60 250 L 60 180 L 85 180 L 85 250 L 235 250 L 235 190 L 255 190 L 255 250 L 275 250 L 275 210 L 320 210 L 320 280 L 0 280 Z" fill="#090d16" opacity="0.7" />

      {/* City Ground / Street */}
      <rect x="0" y="245" width="320" height="35" fill="#020617" />
      <line x1="0" y1="262" x2="320" y2="262" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="12 12" opacity="0.4" />

      {/* Construction Cones & Foundation */}
      <rect x="110" y="238" width="100" height="10" rx="2" fill="#475569" />

      {/* Construction Crane (Visible in stages 0-3) */}
      {!isComplete && (
        <g
          style={{
            transform: `translate(${160}px, ${Math.max(40, 220 - progress * 190)}px)`,
            transition: "transform 0.6s ease-out",
          }}
        >
          {/* Mast */}
          <line x1="25" y1="0" x2="25" y2="40" stroke="#f59e0b" strokeWidth="3" />
          {/* Jib / Arm */}
          <line x1="-35" y1="0" x2="55" y2="0" stroke="#f59e0b" strokeWidth="3" />
          <line x1="-35" y1="0" x2="25" y2="-12" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="55" y1="0" x2="25" y2="-12" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Counterweight */}
          <rect x="-35" y="-4" width="10" height="8" fill="#78350f" />
          {/* Pulley Cable */}
          <line x1="45" y1="0" x2="45" y2="20" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 1" />
          <rect x="42" y="20" width="6" height="5" fill="#f59e0b" />
        </g>
      )}

      {/* THE SKYSCRAPER MAIN BODY */}
      <g>
        {/* Floors Rendering from bottom to top */}
        {Array.from({ length: 7 }).map((_, idx) => {
          const floorY = 212 - idx * 24;
          const isFloorBuilt = idx < floorCount;
          const floorProgress = Math.max(0, Math.min(1, (progress * 7) - idx));

          if (!isFloorBuilt && floorProgress <= 0) return null;

          return (
            <g
              key={idx}
              style={{
                opacity: floorProgress,
                transform: `scaleY(${floorProgress})`,
                transformOrigin: `160px ${floorY + 24}px`,
                transition: "all 0.4s ease-out",
              }}
            >
              {/* Floor Base Structure */}
              <rect x="120" y={floorY} width="80" height="24" fill="url(#buildingGrad)" stroke="#475569" strokeWidth="1" />
              {/* Window grid */}
              {[126, 142, 158, 174, 190].map((winX) => (
                <rect
                  key={winX}
                  x={winX}
                  y={floorY + 5}
                  width="8"
                  height="14"
                  rx="1"
                  fill={isFloorBuilt ? (idx % 2 === 0 ? "#fef08a" : "#38bdf8") : "#334155"}
                  opacity={isFloorBuilt ? 0.9 : 0.4}
                />
              ))}
            </g>
          );
        })}

        {/* Rooftop Penthouse & Spire (Stage 4) */}
        {isSpire && (
          <g
            style={{
              opacity: Math.min(1, (progress - 0.7) * 4),
              transform: `scale(${Math.min(1, (progress - 0.7) * 3.5)})`,
              transformOrigin: "160px 44px",
              transition: "all 0.5s",
            }}
          >
            {/* Penthouse crown */}
            <rect x="135" y="32" width="50" height="14" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
            <rect x="145" y="35" width="30" height="8" rx="1" fill="#38bdf8" opacity="0.8" />

            {/* Radio Antenna Spire */}
            <line x1="160" y1="32" x2="160" y2="10" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Blinking Red Aircraft Beacon */}
            <circle cx="160" cy="10" r="3" fill="#ef4444" className="animate-ping" style={{ animationDuration: "1.2s" }} />
            <circle cx="160" cy="10" r="2.5" fill="#ef4444" />
          </g>
        )}
      </g>

      {/* Completion Fireworks (Stage 5) */}
      {isComplete && (
        <g className="animate-bounce" style={{ animationDuration: "2s" }}>
          {/* Firework Left */}
          <g transform="translate(70, 70)">
            <circle cx="0" cy="0" r="12" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="0" cy="0" r="3" fill="#fbbf24" />
            <line x1="0" y1="-16" x2="0" y2="-8" stroke="#f43f5e" strokeWidth="2" />
            <line x1="16" y1="0" x2="8" y2="0" stroke="#38bdf8" strokeWidth="2" />
            <line x1="-16" y1="0" x2="-8" y2="0" stroke="#a855f7" strokeWidth="2" />
            <line x1="0" y1="16" x2="0" y2="8" stroke="#10b981" strokeWidth="2" />
          </g>

          {/* Firework Right */}
          <g transform="translate(250, 60)">
            <circle cx="0" cy="0" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="0" cy="0" r="3" fill="#f472b6" />
            <line x1="0" y1="-18" x2="0" y2="-9" stroke="#fbbf24" strokeWidth="2" />
            <line x1="18" y1="0" x2="9" y2="0" stroke="#f43f5e" strokeWidth="2" />
            <line x1="-18" y1="0" x2="-9" y2="0" stroke="#10b981" strokeWidth="2" />
          </g>

          {/* Searchlights */}
          <polygon points="120,245 40,0 80,0" fill="#38bdf8" opacity="0.15" />
          <polygon points="200,245 280,0 240,0" fill="#facc15" opacity="0.15" />
        </g>
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                             THEME 3: ROCKET                                */
/* -------------------------------------------------------------------------- */
function RocketVisual({ progress }: { progress: number }) {
  // 5 stages:
  // 0-0.25: Launchpad & Gantries
  // 0.25-0.5: Booster Core & Main Tank
  // 0.5-0.75: Capsule, Fins & Umbilical Cables
  // 0.75-0.95: Vapor Vents & Ignition Spark
  // 0.95-1.0: Blastoff!
  const isBlastoff = progress >= 0.95;
  const isIgnition = progress >= 0.75;
  const isCapsule = progress >= 0.5;
  const isBooster = progress >= 0.25;

  return (
    <svg viewBox="0 0 320 280" className="h-full w-full select-none" aria-label="Rocket Launchpad">
      <defs>
        <linearGradient id="spaceSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#030712" />
          <stop offset="60%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="40%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f97316" />
          <stop offset="80%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Sky Background */}
      <rect width="320" height="280" rx="24" fill="url(#spaceSky)" />

      {/* Stars */}
      {[
        [20, 20], [60, 40], [100, 15], [150, 30], [210, 20], [270, 35], [300, 15],
        [40, 70], [85, 90], [240, 80], [285, 65]
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.2} fill="#ffffff" opacity={0.7} />
      ))}

      {/* Ground Launch Platform */}
      <rect x="0" y="250" width="320" height="30" fill="#0f172a" />
      <rect x="80" y="240" width="160" height="15" rx="3" fill="#334155" stroke="#475569" strokeWidth="1.5" />
      <line x1="80" y1="247" x2="240" y2="247" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 4" opacity="0.5" />

      {/* Launch Tower / Gantry Left & Right */}
      <g stroke="#e11d48" strokeWidth="2">
        {/* Left Gantry */}
        <line x1="90" y1="240" x2="90" y2="70" />
        <line x1="105" y1="240" x2="105" y2="70" />
        <line x1="90" y1="220" x2="105" y2="200" />
        <line x1="90" y1="180" x2="105" y2="160" />
        <line x1="90" y1="140" x2="105" y2="120" />
        <line x1="90" y1="100" x2="105" y2="80" />

        {/* Retractable arm (opens on ignition) */}
        <line
          x1="105"
          y1="100"
          x2={isIgnition ? "115" : "140"}
          y2={isIgnition ? "85" : "100"}
          stroke="#f59e0b"
          strokeWidth="3"
          style={{ transition: "all 0.8s ease-in-out" }}
        />
        <line
          x1="105"
          y1="160"
          x2={isIgnition ? "115" : "140"}
          y2={isIgnition ? "145" : "160"}
          stroke="#f59e0b"
          strokeWidth="3"
          style={{ transition: "all 0.8s ease-in-out" }}
        />
      </g>

      {/* ROCKET ASSEMBLY WITH LIFTOFF TRANSLATION */}
      <g
        style={{
          transform: isBlastoff ? "translateY(-140px)" : "translateY(0px)",
          transition: isBlastoff ? "transform 3s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        }}
      >
        {/* STAGE 1: Main Booster & Core */}
        {isBooster && (
          <g
            style={{
              opacity: Math.min(1, (progress - 0.25) * 4),
              transform: `scaleY(${Math.min(1, (progress - 0.25) * 3)})`,
              transformOrigin: "160px 240px",
              transition: "all 0.4s",
            }}
          >
            {/* Rocket Core Cylinder */}
            <rect x="142" y="110" width="36" height="120" rx="3" fill="url(#rocketBody)" stroke="#94a3b8" strokeWidth="1" />
            {/* Red decorative racing stripe */}
            <rect x="157" y="110" width="6" height="120" fill="#e11d48" />

            {/* Engine Nozzle */}
            <polygon points="146,230 174,230 178,240 142,240" fill="#334155" />

            {/* Side Boosters */}
            <rect x="130" y="150" width="12" height="75" rx="3" fill="url(#rocketBody)" stroke="#94a3b8" />
            <polygon points="130,150 142,150 136,138" fill="#e11d48" />
            <rect x="178" y="150" width="12" height="75" rx="3" fill="url(#rocketBody)" stroke="#94a3b8" />
            <polygon points="178,150 190,150 184,138" fill="#e11d48" />

            {/* Aerodynamic Stabilizer Fins */}
            <polygon points="130,215 118,235 130,235" fill="#e11d48" />
            <polygon points="190,215 202,235 190,235" fill="#e11d48" />
          </g>
        )}

        {/* STAGE 2: Capsule & Nosecone */}
        {isCapsule && (
          <g
            style={{
              opacity: Math.min(1, (progress - 0.5) * 4),
              transform: `translateY(${Math.max(0, (1 - (progress - 0.5) * 4) * -20)}px)`,
              transition: "all 0.4s",
            }}
          >
            {/* Nosecone Cone */}
            <path d="M 142 110 Q 160 55 160 50 Q 160 55 178 110 Z" fill="url(#rocketBody)" stroke="#94a3b8" strokeWidth="1" />
            <polygon points="148,110 172,110 160,50" fill="#e11d48" opacity="0.8" />
            {/* Crew Cabin Window */}
            <circle cx="160" cy="85" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
            {/* Escape Tower Needle */}
            <line x1="160" y1="50" x2="160" y2="30" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="160" cy="30" r="2" fill="#ef4444" />
          </g>
        )}

        {/* STAGE 3: Vapor vents & Pre-ignition */}
        {isIgnition && !isBlastoff && (
          <g opacity="0.6">
            <ellipse cx="120" cy="180" rx="14" ry="5" fill="#ffffff" opacity="0.4" className="animate-ping" style={{ animationDuration: "1.5s" }} />
            <ellipse cx="200" cy="180" rx="14" ry="5" fill="#ffffff" opacity="0.4" className="animate-ping" style={{ animationDuration: "1.5s" }} />
          </g>
        )}

        {/* STAGE 4: MAIN THRUSTER ENGINE FLAME (Blastoff) */}
        {(isIgnition || isBlastoff) && (
          <g>
            {/* Fiery Exhaust Plume */}
            <polygon
              points="144,240 176,240 160,290"
              fill="url(#flameGrad)"
              className="animate-pulse"
              style={{ animationDuration: "0.15s" }}
            />
            <polygon
              points="150,240 170,240 160,270"
              fill="#ffffff"
            />
          </g>
        )}
      </g>

      {/* Billowing Smoke Clouds on launchpad during blastoff */}
      {isBlastoff && (
        <g opacity="0.8">
          <circle cx="120" cy="250" r="25" fill="#94a3b8" opacity="0.7" className="animate-ping" style={{ animationDuration: "1s" }} />
          <circle cx="200" cy="250" r="25" fill="#94a3b8" opacity="0.7" className="animate-ping" style={{ animationDuration: "1s" }} />
          <circle cx="160" cy="245" r="30" fill="#cbd5e1" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                             THEME 4: COFFEE                                */
/* -------------------------------------------------------------------------- */
function CoffeeVisual({ progress }: { progress: number }) {
  // 5 stages:
  // 0-0.25: Coffee Beans & Grinding
  // 0.25-0.5: Espresso stream & Dark brew base
  // 0.5-0.75: Steamed milk pitcher & pouring
  // 0.75-0.95: Detailed Latte Art & Croissant
  // 0.95-1.0: Warm Steam & Cozy Café Sparkles
  const isComplete = progress >= 0.95;
  const isLatteArt = progress >= 0.75;
  const isMilk = progress >= 0.5;
  const isEspresso = progress >= 0.25;

  return (
    <svg viewBox="0 0 320 280" className="h-full w-full select-none" aria-label="Artisanal Coffee Barista">
      <defs>
        <linearGradient id="cafeBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#292524" />
          <stop offset="100%" stopColor="#1c1917" />
        </linearGradient>
        <linearGradient id="woodTable" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="30%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id="cupGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="espressoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="40%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#3b1d06" />
        </linearGradient>
      </defs>

      {/* Café Wall Background */}
      <rect width="320" height="280" rx="24" fill="url(#cafeBg)" />

      {/* Hanging Warm Café Lamp */}
      <line x1="160" y1="0" x2="160" y2="25" stroke="#78716c" strokeWidth="2" />
      <polygon points="140,40 180,40 168,25 152,25" fill="#f59e0b" />
      <ellipse cx="160" cy="40" rx="20" ry="6" fill="#fef08a" opacity="0.8" />
      {/* Light cone */}
      <polygon points="160,40 60,250 260,250" fill="#fef08a" opacity="0.06" />

      {/* Wooden Café Table */}
      <rect x="0" y="210" width="320" height="70" fill="url(#woodTable)" />
      <line x1="0" y1="211" x2="320" y2="211" stroke="#b45309" strokeWidth="2" opacity="0.6" />

      {/* STAGE 0: Whole Roasted Beans on Table */}
      {!isEspresso && (
        <g style={{ opacity: Math.max(0.3, 1 - progress * 4) }}>
          {[
            [130, 230, -20], [150, 240, 30], [175, 235, -10],
            [195, 242, 45], [140, 250, 10], [165, 252, -35]
          ].map(([bx, by, rot], i) => (
            <g key={i} transform={`translate(${bx}, ${by}) rotate(${rot})`}>
              <ellipse cx="0" cy="0" rx="6" ry="4" fill="#3b1d06" stroke="#1c1917" strokeWidth="0.5" />
              <path d="M -3 0 Q 0 -2 3 0" stroke="#78350f" strokeWidth="1" fill="none" />
            </g>
          ))}
          <text x="160" y="160" textAnchor="middle" fill="#d6d3d1" fontSize="13" fontWeight="600" fontFamily="sans-serif">
            Grinding Fresh Beans...
          </text>
        </g>
      )}

      {/* COFFEE CUP & SAUCER (Stages 1+) */}
      {isEspresso && (
        <g>
          {/* Saucer */}
          <ellipse cx="160" cy="225" rx="55" ry="12" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="160" cy="223" rx="42" ry="8" fill="#f8fafc" />

          {/* Cup Handle */}
          <path d="M 205 160 Q 230 160 230 180 Q 230 200 200 200" fill="none" stroke="#f8fafc" strokeWidth="8" strokeLinecap="round" />

          {/* Cup Body */}
          <path d="M 115 150 Q 115 215 160 215 Q 205 215 205 150 Z" fill="url(#cupGrad)" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Cup Rim & Liquid Surface */}
          <ellipse cx="160" cy="150" rx="45" ry="16" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="160" cy="151" rx="40" ry="13" fill="url(#espressoGrad)" />

          {/* Golden Crema Ring */}
          <ellipse cx="160" cy="151" rx="37" ry="11" fill="none" stroke="#d97706" strokeWidth="2.5" opacity="0.7" />

          {/* STAGE 1: Dual Stream of Espresso Pouring */}
          {!isMilk && (
            <g>
              <line x1="155" y1="80" x2="155" y2="150" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
              <line x1="165" y1="80" x2="165" y2="150" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="160" cy="151" rx="10" ry="3" fill="#d97706" className="animate-ping" style={{ animationDuration: "1s" }} />
            </g>
          )}

          {/* STAGE 2: Steamed Milk Pitcher Pouring */}
          {isMilk && !isLatteArt && (
            <g>
              {/* Pitcher */}
              <g transform="translate(200, 70) rotate(-35)">
                <rect x="0" y="0" width="30" height="45" rx="3" fill="#94a3b8" stroke="#64748b" />
                <polygon points="0,0 -8,5 0,10" fill="#64748b" />
              </g>
              {/* Milk stream */}
              <path d="M 195 90 Q 170 120 160 151" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              {/* Growing White Milk Foam in Cup */}
              <ellipse cx="160" cy="151" rx={Math.min(25, (progress - 0.5) * 80)} ry={Math.min(8, (progress - 0.5) * 26)} fill="#ffffff" />
            </g>
          )}

          {/* STAGE 3+: Detailed Latte Art (Rosetta & Heart) */}
          {isLatteArt && (
            <g
              style={{
                transform: `scale(${Math.min(1, (progress - 0.75) * 4.5)})`,
                transformOrigin: "160px 151px",
                transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {/* Latte Art Heart Shape */}
              <path
                d="M 160 156 C 150 148 142 144 148 140 C 154 136 160 144 160 146 C 160 144 166 136 172 140 C 178 144 170 148 160 156 Z"
                fill="#ffffff"
              />
              <circle cx="160" cy="142" r="3" fill="#ffffff" />
              <circle cx="160" cy="146" r="2" fill="#ffffff" />
            </g>
          )}

          {/* Fresh Croissant on a small plate */}
          {isLatteArt && (
            <g
              transform="translate(60, 215)"
              style={{
                opacity: Math.min(1, (progress - 0.75) * 4),
                transition: "opacity 0.5s",
              }}
            >
              <ellipse cx="0" cy="0" rx="30" ry="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
              {/* Golden Croissant */}
              <path d="M -18 -2 Q 0 -12 18 -2 Q 0 4 -18 -2 Z" fill="#d97706" />
              <path d="M -10 -4 Q 0 -10 10 -4" fill="none" stroke="#b45309" strokeWidth="1.5" />
            </g>
          )}

          {/* STAGE 4: Cozy Rising Steam */}
          {(isLatteArt || isComplete) && (
            <g opacity="0.65" className="animate-pulse" style={{ animationDuration: "2s" }}>
              <path d="M 150 135 Q 145 110 152 95 Q 160 80 150 65" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              <path d="M 162 135 Q 168 110 160 90 Q 155 75 165 55" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
              <path d="M 172 135 Q 178 115 172 100 Q 168 85 175 70" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            </g>
          )}
        </g>
      )}

      {/* Completion Sparkles */}
      {isComplete && (
        <g>
          <text x="75" y="80" fontSize="16">✨</text>
          <text x="235" y="90" fontSize="16">☕</text>
          <text x="150" y="40" fontSize="18">🌟</text>
        </g>
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                           MAIN TOOL COMPONENT                              */
/* -------------------------------------------------------------------------- */
export function PomodoroTimerTool() {
  const [theme, setTheme] = useState<ThemeType>("tree");
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isWork, setIsWork] = useState(true);
  const [running, setRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [builtCollection, setBuiltCollection] = useState<{ id: string; theme: ThemeType; time: string }[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date>(new Date());

  const workMinutesRangeId = useId();
  const breakMinutesRangeId = useId();
  const longBreakMinutesRangeId = useId();

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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function handleTimerEnd() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);

    if (soundEnabled) {
      playCompletionChime();
    }

    if (isWork) {
      const elapsed = workMinutes * 60;
      setSessionsCompleted((prev) => prev + 1);
      setTotalFocusTime((prev) => prev + elapsed);

      // Add to built creations collection
      setBuiltCollection((prev) => [
        {
          id: Math.random().toString(),
          theme,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ]);

      const nextCount = sessionsCompleted + 1;
      if (nextCount % 4 === 0) {
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

  function skip() {
    handleTimerEnd();
  }

  const totalCurrentDuration = isWork
    ? workMinutes * 60
    : (sessionsCompleted % 4 === 0 && sessionsCompleted > 0 ? longBreakMinutes : breakMinutes) * 60;

  const progress = Math.max(0, Math.min(1, 1 - secondsLeft / totalCurrentDuration));
  const progressPercent = Math.round(progress * 100);

  // Status message for each theme based on progress
  const getStageDescription = () => {
    if (!isWork) return "☕ Break Time — Relax and recharge!";

    if (theme === "tree") {
      if (progress < 0.2) return "🌱 Stage 1: Sprouting seed in fertile soil...";
      if (progress < 0.45) return "🌿 Stage 2: Young sapling shoots upward...";
      if (progress < 0.75) return "🌳 Stage 3: Branches spreading & leaves growing...";
      if (progress < 0.95) return "🍃 Stage 4: Lush full canopy & berries forming...";
      return "🌸 Stage 5: Flowers blooming & butterflies fluttering!";
    }

    if (theme === "skyscraper") {
      if (progress < 0.2) return "🏗️ Stage 1: Foundation concrete & crane positioned...";
      if (progress < 0.45) return "🏢 Stage 2: Steel beams & lower glass floors...";
      if (progress < 0.7) return "🏙️ Stage 3: Mid-tower rising with glowing windows...";
      if (progress < 0.9) return "🗼 Stage 4: Penthouse & red beacon antenna...";
      return "🎉 Stage 5: Searchlights & celebratory fireworks!";
    }

    if (theme === "rocket") {
      if (progress < 0.25) return "🛸 Stage 1: Launchpad gantry securing platform...";
      if (progress < 0.5) return "🚀 Stage 2: Core booster & fuel tanks lowered...";
      if (progress < 0.75) return "🛰️ Stage 3: Crew capsule mounted & cables connected...";
      if (progress < 0.95) return "⚡ Stage 4: Cryogenic vapor venting & pre-ignition...";
      return "🔥 Stage 5: Main engine ignition & orbital blastoff!";
    }

    if (theme === "coffee") {
      if (progress < 0.25) return "🫘 Stage 1: Grinding artisanal roast beans...";
      if (progress < 0.5) return "☕ Stage 2: Extracting rich espresso & golden crema...";
      if (progress < 0.75) return "🥛 Stage 3: Steaming silky microfoam milk...";
      if (progress < 0.95) return "🎨 Stage 4: Crafting rosetta latte art & warm pastry...";
      return "✨ Stage 5: Hot steaming coffee ready to enjoy!";
    }

    return "Focus Session";
  };

  const getThemeIcon = (t: ThemeType) => {
    switch (t) {
      case "tree": return "🌲";
      case "skyscraper": return "🏙️";
      case "rocket": return "🚀";
      case "coffee": return "☕";
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Visual Builder Pomodoro Timer">
        <p className="text-sm text-slate-600 mb-5">
          Stay focused while watching your creation assemble in real-time. Choose your theme, start your 25-minute focus session, and watch a tree flourish, skyscraper rise, rocket launch, or artisanal coffee brew!
        </p>

        {/* Theme Picker Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "tree", label: "🌲 Bonsai Tree", desc: "Sprout -> Bloom" },
                { id: "skyscraper", label: "🏙️ Skyscraper", desc: "Foundation -> Tower" },
                { id: "rocket", label: "🚀 Rocket Launch", desc: "Gantry -> Blastoff" },
                { id: "coffee", label: "☕ Cozy Coffee", desc: "Grind -> Latte Art" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition ${
                  theme === t.id
                    ? "border-sky-500 bg-sky-50 text-sky-950 shadow-sm ring-2 ring-sky-300/60"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              soundEnabled ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            {soundEnabled ? "🔔 Sound Chime ON" : "🔕 Sound Muted"}
          </button>
        </div>

        {/* Main Stage & Controls */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Visual Theater & Digital Timer */}
          <div className="flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm">
            <div className="flex w-full items-center justify-between">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  isWork ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isWork ? `Focus Session (${sessionsCompleted % 4 + 1}/4)` : "Break Time"}
              </span>

              <span className="font-mono text-xs font-bold text-slate-500">
                {progressPercent}% Built
              </span>
            </div>

            {/* Visual Canvas */}
            <div className="my-4 h-64 w-full max-w-[340px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2 shadow-inner">
              {theme === "tree" && <TreeVisual progress={progress} />}
              {theme === "skyscraper" && <SkyscraperVisual progress={progress} />}
              {theme === "rocket" && <RocketVisual progress={progress} />}
              {theme === "coffee" && <CoffeeVisual progress={progress} />}
            </div>

            {/* Stage description message */}
            <div className="text-center">
              <p className="font-medium text-xs text-slate-600 animate-pulse">
                {getStageDescription()}
              </p>
              <div className="font-mono text-4xl font-extrabold tracking-tight text-slate-900 mt-2 sm:text-5xl select-all">
                {formatTime(secondsLeft)}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={running ? pause : start}
                className={
                  buttonClass +
                  " flex items-center gap-2 px-8 py-3 text-base shadow-md " +
                  (running ? "bg-amber-600 hover:bg-amber-700" : "bg-sky-600 hover:bg-sky-700")
                }
              >
                {running ? "⏸️ Pause" : "▶️ Start Focus"}
              </button>
              <button type="button" onClick={reset} className={softButtonClass}>
                🔄 Reset
              </button>
              <button type="button" onClick={skip} className={softButtonClass} title="Skip current session">
                ⏭️ Skip
              </button>
            </div>
          </div>

          {/* Right Sidebar: Settings & Creation Trophies */}
          <div className="space-y-4">
            {/* Durations */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Session Intervals
              </h4>
              <div className="space-y-3">
                <label htmlFor={workMinutesRangeId} className="block">
                  <span className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Work Duration</span>
                    <span className="font-mono font-bold text-sky-700">{workMinutes}m</span>
                  </span>
                  <input
                    id={workMinutesRangeId}
                    type="range"
                    min={1}
                    max={60}
                    value={workMinutes}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setWorkMinutes(val);
                      if (!running && isWork) setSecondsLeft(val * 60);
                    }}
                    className="mt-1 w-full accent-sky-600"
                  />
                </label>

                <label htmlFor={breakMinutesRangeId} className="block">
                  <span className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Short Break</span>
                    <span className="font-mono font-bold text-emerald-700">{breakMinutes}m</span>
                  </span>
                  <input
                    id={breakMinutesRangeId}
                    type="range"
                    min={1}
                    max={30}
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Number(e.target.value))}
                    className="mt-1 w-full accent-emerald-600"
                  />
                </label>

                <label htmlFor={longBreakMinutesRangeId} className="block">
                  <span className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Long Break (Every 4th)</span>
                    <span className="font-mono font-bold text-purple-700">{longBreakMinutes}m</span>
                  </span>
                  <input
                    id={longBreakMinutesRangeId}
                    type="range"
                    min={1}
                    max={60}
                    value={longBreakMinutes}
                    onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                    className="mt-1 w-full accent-purple-600"
                  />
                </label>
              </div>
            </div>

            {/* Daily Stats Grid */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Focus Statistics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-center">
                  <p className="font-mono text-2xl font-bold text-sky-900">{sessionsCompleted}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Sessions Done</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-center">
                  <p className="font-mono text-2xl font-bold text-emerald-900">{Math.floor(totalFocusTime / 60)}m</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Time Focused</p>
                </div>
              </div>

              {/* Built Creations Trophy Tray */}
              {builtCollection.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Today&apos;s Creations ({builtCollection.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {builtCollection.map((item) => (
                      <span
                        key={item.id}
                        title={`Completed at ${item.time}`}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono"
                      >
                        <span>{getThemeIcon(item.theme)}</span>
                        <span className="text-[10px] text-slate-400">{item.time}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
