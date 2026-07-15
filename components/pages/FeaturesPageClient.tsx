"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/pages/PageHeader";

const features = [
  {
    href: "/features/stopwatch",
    label: "Stopwatch",
    description: "A focused timer users can keep open while working through any task.",
    status: "Available",
    icon: "timer"
  },
  {
    href: "/features/image-converter",
    label: "Image Converter",
    description: "Convert browser-supported image files with quality control and side-by-side preview.",
    status: "Available",
    icon: "image"
  },
  {
    href: "/features/image-background-remover",
    label: "Image Background Remover",
    description: "Remove image backgrounds locally and export clean transparent PNG files.",
    status: "Available",
    icon: "cutout"
  },
  {
    href: "/features/notes",
    label: "Notes",
    description: "Keep text notes, links, tags, pinned items, and archived references in one focused workspace.",
    status: "Available",
    icon: "notes"
  },
  {
    href: "/features/developer-tools",
    label: "Developer Tools",
    description: "15 tools: JSON, JWT, Base64, UUID, Hash, Regex, Timestamp, Color, Diff, Markdown, CSV, API, Dummy Data, and QR Code.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/password-generator",
    label: "Password Generator",
    description: "Generate strength-rated passwords with customizable options.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/cron-parser",
    label: "Cron Parser",
    description: "Convert cron expressions to human-readable schedules.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/json-schema-validator",
    label: "JSON Schema Validator",
    description: "Validate JSON data against a JSON Schema definition.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/word-diff",
    label: "Word Diff",
    description: "Compare text with word-level diff highlighting.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/hmac-signing",
    label: "HMAC Signing",
    description: "Create and verify HMAC-SHA signatures for data integrity.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/html-email-preview",
    label: "HTML Email Preview",
    description: "Preview HTML email templates with live rendering.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/svg-viewer",
    label: "SVG Viewer",
    description: "Preview, minify, and export SVG images as PNG.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/regex-debugger",
    label: "Regex Debugger",
    description: "Step through regex patterns with detailed match analysis.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/cheat-sheets",
    label: "Cheat Sheets",
    description: "Quick reference for HTTP, CSS, SQL, Linux, and Git commands.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/text-transform",
    label: "Text Transform",
    description: "Transform text case, convert unicode, and handle HTML entities.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/pomodoro-timer",
    label: "Pomodoro Timer",
    description: "25/5 minute focus timer for productive work sessions.",
    status: "Available",
    icon: "timer"
  },
  {
    href: "/features/batch-image-resizer",
    label: "Batch Image Resizer",
    description: "Resize multiple images at once with batch processing.",
    status: "Available",
    icon: "image"
  },
  {
    href: "/features/clipboard-history",
    label: "Clipboard History",
    description: "Manager for tracking and reusing clipboard content.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/color-palette-generator",
    label: "Color Palette Generator",
    description: "Generate harmonious color palettes for design projects.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/markdown-to-slides",
    label: "Markdown to Slides",
    description: "Convert Markdown content into presentation slides.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/json-to-typescript",
    label: "JSON to TypeScript",
    description: "Generate TypeScript interfaces and Zod schemas from JSON.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/lorem-ipsum-generator",
    label: "Lorem Ipsum Generator",
    description: "Generate placeholder text for design and development.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/unit-converter",
    label: "Unit Converter",
    description: "Convert between length, weight, data, and time units.",
    status: "Available",
    icon: "tools"
  },
  {
    href: "/features/image-metadata-viewer",
    label: "Image Metadata Editor",
    description: "View, edit, and delete EXIF metadata from image files.",
    status: "Available",
    icon: "image"
  },
  {
    href: "/features/regex-playbook",
    label: "Regex Playbook",
    description: "Pattern library and tester for regular expressions.",
    status: "Available",
    icon: "tools"
  }
];

function FeatureIcon({ name }: { name: string }) {
  if (name === "tools") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M8 7 4 12l4 5M16 7l4 5-4 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="m14 5-4 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "notes") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M7 4h8l4 4v12H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M15 4v5h5" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M8 13h8M8 16h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "image") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m7 16 3.2-3.2 2.4 2.4 2.1-2.1L18 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <circle cx="9" cy="9" r="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (name === "cutout") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 16.5 16.5 8M9 8h3M8 9v3M12 17h3M17 12v3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M9 3h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M12 8v4l2.5 2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function FeaturesPageClient() {
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 lg:px-8">
      <PageHeader
        eyebrow="Features"
        title="Workspace Tools"
        description="A growing collection of lightweight apps users can open whenever they need a little extra utility during the day."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            onClick={() => setLoading(feature.href)}
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
                <FeatureIcon name={feature.icon} />
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{feature.status}</span>
            </div>
            <div className="mt-5">
              <h2 className="text-lg font-semibold text-slate-950">{feature.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
            </div>
            <div className="mt-6 text-sm font-semibold text-sky-700 transition group-hover:text-sky-800">
              {loading === feature.href ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-300 border-t-sky-700" />
                  Loading...
                </span>
              ) : (
                "Open app"
              )}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}