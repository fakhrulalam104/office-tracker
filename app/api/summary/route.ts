import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Entry } from "@/models/Entry";
import { getUserSettings } from "@/lib/settings";
import {
  EXPENSE_CATEGORIES,
  countHolidayDaysForMonth,
  expenseCategoryLabel,
  getFineStateForLimit,
  isTimeOffStatus,
  monthBounds,
  normalizeDailyExpenses,
  normalizeDayStatus,
  parseMonthKey,
  totalDailyExpenses
} from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const month = parseMonthKey(request.nextUrl.searchParams.get("month"));
    const { start, end } = monthBounds(month);
    const settings = await getUserSettings(userId);

    await connectToDatabase();
    const entries = await Entry.find({
      userId,
      date: { $gte: start, $lte: end }
    }).lean();

    const workEntries = entries.filter((entry) => !isTimeOffStatus(entry.dayStatus));
    const totalDelayMinutes = workEntries.reduce((total, entry) => total + (entry.delayMinutes ?? 0), 0);
    const lunchDays = workEntries.filter((entry) => entry.hadLunch).length;
    const holidayDays = countHolidayDaysForMonth(month, entries, settings);
    const sickDays = entries.filter((entry) => normalizeDayStatus(entry.dayStatus) === "sick").length;
    const leaveDays = entries.filter((entry) => normalizeDayStatus(entry.dayStatus) === "leave").length;
    const lunchSpend = lunchDays * settings.lunchPrice;
    const workDays = workEntries.length;
    const allExpenses = entries.flatMap((entry) => normalizeDailyExpenses(entry.dailyExpenses, entry.dailyExpenseAmount, entry.dailyExpenseNote));
    const dailyExpenseTotal = totalDailyExpenses(allExpenses);
    const expenseCategories = EXPENSE_CATEGORIES.map((category) => {
      const expenses = allExpenses.filter((expense) => expense.category === category.value);
      return {
        category: category.value,
        label: expenseCategoryLabel(category.value),
        total: totalDailyExpenses(expenses),
        count: expenses.length
      };
    }).filter((category) => category.total > 0 || category.count > 0);
    const weeklyDelayMinutes = Array.from({ length: 5 }, (_, index) => {
      const weekEntries = workEntries.filter((entry) => {
        const day = Number(String(entry.date).slice(8, 10));
        return Math.floor((day - 1) / 7) === index;
      });

      return {
        label: `Week ${index + 1}`,
        minutes: weekEntries.reduce((total, entry) => total + (entry.delayMinutes ?? 0), 0)
      };
    });
    const highestExpense = expenseCategories.reduce((highest, category) => (category.total > highest.total ? category : highest), {
      category: "other" as const,
      label: "Other",
      total: 0,
      count: 0
    });
    const insights = [
      `You were late ${workEntries.filter((entry) => (entry.delayMinutes ?? 0) > 0).length} day${workEntries.filter((entry) => (entry.delayMinutes ?? 0) > 0).length === 1 ? "" : "s"} this month.`,
      highestExpense.total > 0
        ? `Most expenses are in ${highestExpense.label.toLowerCase()} at ${highestExpense.total.toLocaleString("en-US")} ${settings.currency}.`
        : "No personal expenses tracked yet this month.",
      lunchDays > 0
        ? `Office lunch added ${lunchSpend.toLocaleString("en-US")} ${settings.currency} across ${lunchDays} day${lunchDays === 1 ? "" : "s"}.`
        : "No office lunch spend recorded this month.",
      getFineStateForLimit(totalDelayMinutes, settings.delayLimit).description
    ];

    return NextResponse.json({
      month,
      totalDelayMinutes,
      lunchDays,
      lunchSpend,
      holidayDays,
      sickDays,
      leaveDays,
      workDays,
      dailyExpenseTotal,
      dailyExpenseCount: allExpenses.length,
      expenseCategories,
      weeklyDelayMinutes,
      insights,
      delayLimit: settings.delayLimit,
      lunchPrice: settings.lunchPrice,
      currency: settings.currency
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load summary", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
