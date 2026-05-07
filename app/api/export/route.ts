import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getUserSettings } from "@/lib/settings";
import { Entry } from "@/models/Entry";
import { expenseCategoryLabel, formatDateLabel, monthBounds, normalizeDailyExpenses, normalizeDayStatus, parseMonthKey, totalDailyExpenses } from "@/lib/utils";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const month = parseMonthKey(request.nextUrl.searchParams.get("month"));
    const settings = await getUserSettings(userId);
    const { start, end } = monthBounds(month);

    await connectToDatabase();
    const entries = await Entry.find({
      userId,
      date: { $gte: start, $lte: end }
    })
      .sort({ date: 1 })
      .lean();

    const rows = [
      ["Date", "Status", "Delay Minutes", "Office Lunch", "Lunch Spend", "Expense Total", "Expense Items", "Comment"],
      ...entries.map((entry) => {
        const expenses = normalizeDailyExpenses(entry.dailyExpenses, entry.dailyExpenseAmount, entry.dailyExpenseNote);
        const expenseItems = expenses
          .map((expense) => `${expenseCategoryLabel(expense.category)}: ${expense.amount} ${settings.currency}${expense.note ? ` - ${expense.note}` : ""}`)
          .join("; ");

        return [
          formatDateLabel(entry.date),
          normalizeDayStatus(entry.dayStatus),
          normalizeDayStatus(entry.dayStatus) === "work" ? entry.delayMinutes ?? 0 : 0,
          entry.hadLunch ? "Yes" : "No",
          entry.hadLunch ? settings.lunchPrice : 0,
          totalDailyExpenses(expenses),
          expenseItems,
          entry.comment ?? ""
        ];
      })
    ];

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="office-tracker-${month}.csv"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to export month", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
