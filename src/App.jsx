import { useState, useCallback, useEffect } from "react";
import { loadData, upsertEntry, deleteEntry, saveData } from "./utils/storage";
import { getTodayStr } from "./utils/dateHelpers";
import Header from "./components/Header";
import MonthGrid from "./components/MonthGrid";
import LogModal from "./components/LogModal";
import Summary from "./components/Summary";
import ExportImport from "./components/ExportImport";

function getInitialMonth() {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() };
}

export default function App() {
  const [{ year, month }, setYearMonth] = useState(getInitialMonth);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalDate, setModalDate] = useState(null);

  // Load data from MongoDB on app mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const initialData = await loadData();
        setData(initialData);
      } catch (error) {
        console.error("Failed to initialize data:", error);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  function prevMonth() {
    setYearMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  }
  function nextMonth() {
    setYearMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  }

  async function handleSave(dateStr, entry) {
    const updated = await upsertEntry(data, dateStr, entry);
    setData(updated);
    setModalDate(null);
  }

  async function handleDelete(dateStr) {
    const updated = await deleteEntry(data, dateStr);
    setData(updated);
  }

  async function handleImport(newData) {
    await saveData(newData);
    setData(newData);
  }

  const modalEntry = modalDate ? data[modalDate] || null : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 py-8 px-4 flex items-center justify-center">
        <p className="text-stone-600">Loading data from MongoDB...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Header
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
        />

        <ExportImport data={data} onImport={handleImport} />

        <MonthGrid
          year={year}
          month={month}
          data={data}
          onDayClick={setModalDate}
        />

        <Summary data={data} year={year} month={month} />

        <p className="text-center text-xs text-stone-300 mono mt-6">
          data stored in MongoDB
        </p>
      </div>

      {modalDate && (
        <LogModal
          dateStr={modalDate}
          entry={modalEntry}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModalDate(null)}
        />
      )}
    </div>
  );
}
