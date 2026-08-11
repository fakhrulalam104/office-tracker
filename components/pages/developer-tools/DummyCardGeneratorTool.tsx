"use client";

import { useState } from "react";

type CardTypeKey = "visa" | "mastercard" | "amex" | "discover" | "jcb" | "maestro";

interface CardType {
  key: CardTypeKey;
  label: string;
  brand: string;
  numberLength: number;
  cvvLength: number;
  bins: string[];
  banks: string[];
  gradient: string;
}

const CARD_TYPES: CardType[] = [
  {
    key: "visa",
    label: "Visa",
    brand: "VISA",
    numberLength: 16,
    cvvLength: 3,
    bins: ["4"],
    banks: ["Chase", "Bank of America", "Wells Fargo", "Citibank", "Capital One"],
    gradient: "linear-gradient(135deg, #1a1f7a 0%, #2d2f8f 55%, #3d5ab5 100%)"
  },
  {
    key: "mastercard",
    label: "Mastercard",
    brand: "MASTERCARD",
    numberLength: 16,
    cvvLength: 3,
    bins: ["51", "52", "53", "54", "55", "2221", "2222", "2315", "2720", "2728"],
    banks: ["HSBC", "Barclays", "Capital One", "BNP Paribas", "Santander"],
    gradient: "linear-gradient(135deg, #b71c1c 0%, #ff5f00 55%, #ffb300 100%)"
  },
  {
    key: "amex",
    label: "American Express",
    brand: "AMEX",
    numberLength: 15,
    cvvLength: 4,
    bins: ["34", "37"],
    banks: ["American Express", "Morgan Stanley", "Goldman Sachs"],
    gradient: "linear-gradient(135deg, #0d47a1 0%, #1f8bdf 60%, #42a5f5 100%)"
  },
  {
    key: "discover",
    label: "Discover",
    brand: "DISCOVER",
    numberLength: 16,
    cvvLength: 3,
    bins: ["6011", "622126", "622925", "644", "645", "646", "647", "648", "649", "65"],
    banks: ["Discover Bank", "Pulse"],
    gradient: "linear-gradient(135deg, #b71c1c 0%, #f57f17 55%, #fbc02d 100%)"
  },
  {
    key: "jcb",
    label: "JCB",
    brand: "JCB",
    numberLength: 16,
    cvvLength: 3,
    bins: ["3528", "3529", "3530", "3566", "3570", "3589"],
    banks: ["MUFG Bank", "Mizuho Bank", "Sumitomo Mitsui"],
    gradient: "linear-gradient(135deg, #0f3b3d 0%, #1a6f6f 60%, #2fa78f 100%)"
  },
  {
    key: "maestro",
    label: "Maestro",
    brand: "MAESTRO",
    numberLength: 16,
    cvvLength: 3,
    bins: ["5018", "5020", "5038", "5893", "6304", "6759", "6761", "6762", "6763"],
    banks: ["Lloyds Bank", "Deutsche Bank", "BNP Paribas", "Rabobank"],
    gradient: "linear-gradient(135deg, #1f2937 0%, #374151 60%, #6b7280 100%)"
  }
];

const FIRST_NAMES = [
  "James",
  "Mary",
  "Robert",
  "Patricia",
  "John",
  "Jennifer",
  "David",
  "Linda",
  "Michael",
  "Elizabeth",
  "William",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Charles",
  "Karen"
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin"
];

interface CardData {
  type: string;
  brand: string;
  name: string;
  number: string;
  formattedNumber: string;
  expiry: string;
  cvv: string;
  bank: string;
}

const sectionClass = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm";
const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100";
const buttonClass = "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800";
const softButtonClass = "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function luhnCheckDigit(digits: number[]): number {
  const reversed = [...digits].reverse();
  let sum = 0;
  reversed.forEach((digit, index) => {
    if (index % 2 === 0) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  });
  return (10 - (sum % 10)) % 10;
}

function generateNumber(bin: string, length: number): string {
  const digits = bin.split("").map(Number);
  while (digits.length < length - 1) {
    digits.push(Math.floor(Math.random() * 10));
  }
  digits.push(luhnCheckDigit(digits));
  return digits.join("");
}

function formatNumber(number: string, type: CardTypeKey): string {
  if (type === "amex") {
    return `${number.slice(0, 4)} ${number.slice(4, 10)} ${number.slice(10, 15)}`;
  }
  return number.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function randomExpiry(): string {
  const month = 1 + Math.floor(Math.random() * 12);
  const year = new Date().getFullYear() + 1 + Math.floor(Math.random() * 5);
  return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

function randomCvv(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function generateCard(type: CardTypeKey): CardData {
  const cardType = CARD_TYPES.find((item) => item.key === type) ?? CARD_TYPES[0];
  const number = generateNumber(pick(cardType.bins), cardType.numberLength);
  return {
    type: cardType.label,
    brand: cardType.brand,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    number,
    formattedNumber: formatNumber(number, type),
    expiry: randomExpiry(),
    cvv: randomCvv(cardType.cvvLength),
    bank: pick(cardType.banks)
  };
}

function fullDetails(card: CardData, typeLabel: string): string {
  return [
    `Card type: ${typeLabel}`,
    `Cardholder name: ${card.name}`,
    `Card number: ${card.formattedNumber}`,
    `Expiry: ${card.expiry}`,
    `CVV: ${card.cvv}`,
    `Issuer: ${card.bank}`
  ].join("\n");
}

function Chip() {
  return (
    <div
      className="relative h-9 w-12 overflow-hidden rounded-md border border-amber-700/50 shadow-inner"
      style={{ background: "linear-gradient(135deg, #f6e27a 0%, #d4af37 55%, #b8860b 100%)" }}
    >
      <div className="absolute inset-0 flex">
        <span className="h-full w-[38%] border-x border-amber-700/40" />
      </div>
      <div className="absolute inset-0 grid grid-cols-3">
        <span className="border-r border-amber-800/30" />
        <span className="border-r border-amber-800/30" />
      </div>
    </div>
  );
}

function ContactlessIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 rotate-90 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M6 9a8 8 0 0 1 0 6" />
      <path d="M9.5 7.5a11 11 0 0 1 0 9" />
      <path d="M13 6a14 14 0 0 1 0 12" />
    </svg>
  );
}

function CardFront({ card, cardType }: { card: CardData; cardType: CardType }) {
  return (
    <div
      className="relative aspect-[1.586/1] w-full max-w-[420px] select-none overflow-hidden rounded-3xl shadow-2xl"
      style={{ background: cardType.gradient }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex h-full flex-col p-6 text-white">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/80 sm:text-xs">Office Tracker</span>
          <span className="text-base font-black tracking-[0.12em] sm:text-lg">{card.brand}</span>
        </div>

        <div className="mt-5 flex items-center gap-5">
          <Chip />
          <ContactlessIcon />
        </div>

        <div className="flex-1" />

        <p className="whitespace-pre text-base font-semibold tracking-[0.14em] tabular-nums sm:text-xl [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
          {card.formattedNumber}
        </p>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/75">Card holder</p>
            <p className="mt-1 truncate text-sm font-bold uppercase tracking-wider [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] sm:text-base">
              {card.name}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/75">Expires</p>
            <p className="mt-1 text-sm font-semibold tracking-wider tabular-nums [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] sm:text-base">
              {card.expiry}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardBack({ card, cardType }: { card: CardData; cardType: CardType }) {
  return (
    <div
      className="relative aspect-[1.586/1] w-full max-w-[420px] select-none overflow-hidden rounded-3xl shadow-2xl"
      style={{ background: cardType.gradient }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="pointer-events-none absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />

      <div className="relative mt-8">
        <div className="h-11 w-full bg-slate-950" />
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 flex-1 items-center overflow-hidden rounded-md bg-white/90 px-3">
              <span className="truncate font-serif text-xs italic text-slate-500">Authorized signature</span>
            </div>
            <div className="flex h-10 items-center gap-2 rounded-md bg-slate-100 px-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">CVV</span>
              <span className="font-mono text-sm font-bold tabular-nums text-slate-800">{card.cvv}</span>
            </div>
          </div>
          <p className="mt-5 text-[10px] leading-4 text-white/75">
            This is a randomly generated dummy card for testing and demo purposes only. It is not a real, valid, or usable
            payment card.
          </p>
        </div>
      </div>

      <div className="absolute bottom-5 right-6 text-base font-black tracking-[0.12em] text-white/90 sm:text-lg">{card.brand}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-0.5 truncate font-mono text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export function DummyCardGeneratorTool() {
  const [selected, setSelected] = useState<CardTypeKey>("visa");
  const [card, setCard] = useState<CardData>(() => generateCard("visa"));
  const [copied, setCopied] = useState<{ number?: boolean; details?: boolean }>({});

  const cardType = CARD_TYPES.find((item) => item.key === selected) ?? CARD_TYPES[0];

  function selectType(type: CardTypeKey) {
    setSelected(type);
    setCard(generateCard(type));
  }

  function regenerate() {
    setCard(generateCard(selected));
  }

  function copy(value: string, field: "number" | "details") {
    void navigator.clipboard?.writeText(value);
    setCopied((prev) => ({ ...prev, [field]: true }));
    window.setTimeout(() => setCopied((prev) => ({ ...prev, [field]: false })), 1600);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-slate-950">Options</h2>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Select card type</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CARD_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => selectType(type.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selected === type.key
                  ? "bg-slate-950 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <button type="button" onClick={regenerate} className={`mt-4 ${buttonClass}`}>
          Generate new card
        </button>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => copy(card.formattedNumber, "number")}
            className={copied.number ? `${softButtonClass} border-emerald-200 text-emerald-700` : softButtonClass}
          >
            {copied.number ? "✓ Card number copied" : "Copy card number"}
          </button>
          <button
            type="button"
            onClick={() => copy(fullDetails(card, cardType.label), "details")}
            className={copied.details ? `${softButtonClass} border-emerald-200 text-emerald-700` : softButtonClass}
          >
            {copied.details ? "✓ Full details copied" : "Copy full details"}
          </button>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-slate-950">Preview</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Front</p>
            <CardFront card={card} cardType={cardType} />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Back</p>
            <CardBack card={card} cardType={cardType} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <FieldRow label="Cardholder name" value={card.name} />
          <FieldRow label="Card number" value={card.formattedNumber} />
          <FieldRow label="Expiry" value={card.expiry} />
          <FieldRow label="CVV" value={card.cvv} />
          <FieldRow label="Card type" value={card.type} />
          <FieldRow label="Issuer" value={card.bank} />
        </div>
      </section>
    </div>
  );
}
