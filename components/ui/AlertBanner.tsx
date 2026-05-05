type AlertTone = "warning" | "danger";

export function AlertBanner({
  tone,
  message
}: {
  tone: AlertTone;
  message: string;
}) {
  const styles =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-8">
      <div className={`animate-slideDown rounded-2xl border px-4 py-3 shadow-sm ${styles}`}>
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
