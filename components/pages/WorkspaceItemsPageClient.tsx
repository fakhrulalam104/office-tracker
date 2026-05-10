"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/pages/PageHeader";

export type WorkspaceToolType = "leave" | "task" | "announcement" | "asset" | "document" | "project" | "ticket" | "calendar";

type WorkspaceItem = {
  id: string;
  type: WorkspaceToolType;
  title: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  dueDate: string;
  amount: number;
  tags: string[];
  metadata: Record<string, unknown>;
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
};

type Assignee = {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
};

type TaskMetadata = {
  managerId?: string;
  managerName?: string;
  clientName?: string;
  category?: string;
  stagingUrl?: string;
  stagingUsername?: string;
  stagingPassword?: string;
  assignedBy?: string;
  timeSpentSeconds?: number;
  submittedAt?: string;
  comments?: Array<{
    id: string;
    author: string;
    message: string;
    createdAt: string;
  }>;
};

type ActiveTaskTimer = {
  taskId: string;
  title: string;
  startedAt: number;
  accumulatedSeconds: number;
};

type Config = {
  eyebrow: string;
  title: string;
  description: string;
  singular: string;
  titleLabel: string;
  descriptionLabel: string;
  statuses: string[];
  priorities: string[];
  showStartDate?: boolean;
  showDueDate?: boolean;
  showAmount?: boolean;
  amountLabel?: string;
  tagHint?: string;
};

export const workspacePageConfigs: Record<WorkspaceToolType, Config> = {
  leave: {
    eyebrow: "HR",
    title: "Leave Management",
    description: "Request leave, track approval status, and keep upcoming absences visible for the team.",
    singular: "leave request",
    titleLabel: "Reason",
    descriptionLabel: "Notes",
    statuses: ["pending", "approved", "rejected", "cancelled"],
    priorities: ["normal", "urgent"],
    showStartDate: true,
    showDueDate: true,
    tagHint: "annual, sick, unpaid"
  },
  task: {
    eyebrow: "Work",
    title: "Task Board",
    description: "Track daily work, priorities, and delivery status in a lightweight kanban-style list.",
    singular: "task",
    titleLabel: "Task name",
    descriptionLabel: "Details",
    statuses: ["todo", "in_progress", "review", "done"],
    priorities: ["low", "normal", "high", "urgent"],
    showDueDate: true,
    tagHint: "frontend, backend, qa"
  },
  announcement: {
    eyebrow: "Company",
    title: "Announcements",
    description: "Post company updates, policy notes, reminders, and team-wide notices.",
    singular: "announcement",
    titleLabel: "Headline",
    descriptionLabel: "Message",
    statuses: ["draft", "published", "archived"],
    priorities: ["normal", "important", "urgent"],
    showDueDate: true,
    tagHint: "policy, holiday, event"
  },
  asset: {
    eyebrow: "Admin",
    title: "Asset Tracker",
    description: "Track laptops, monitors, phones, SIMs, accessories, ownership, and return status.",
    singular: "asset",
    titleLabel: "Asset name",
    descriptionLabel: "Serial, condition, owner, or notes",
    statuses: ["available", "assigned", "maintenance", "returned", "retired"],
    priorities: ["normal", "needs_review"],
    showAmount: true,
    amountLabel: "Estimated value",
    tagHint: "laptop, monitor, phone"
  },
  document: {
    eyebrow: "Office",
    title: "Document Generator",
    description: "Prepare reusable office documents such as letters, certificates, meeting minutes, and invoices.",
    singular: "document",
    titleLabel: "Document title",
    descriptionLabel: "Template content or notes",
    statuses: ["draft", "ready", "sent", "archived"],
    priorities: ["normal", "important"],
    showDueDate: true,
    tagHint: "offer, invoice, certificate"
  },
  project: {
    eyebrow: "Delivery",
    title: "Project & Client Tracker",
    description: "Track clients, project health, deadlines, assigned teams, and payment or delivery notes.",
    singular: "project",
    titleLabel: "Project or client",
    descriptionLabel: "Scope, contacts, milestones, or notes",
    statuses: ["lead", "active", "at_risk", "completed", "paused"],
    priorities: ["low", "normal", "high", "critical"],
    showStartDate: true,
    showDueDate: true,
    showAmount: true,
    amountLabel: "Budget / value",
    tagHint: "client, web, retainer"
  },
  ticket: {
    eyebrow: "Support",
    title: "Internal Tickets",
    description: "Collect IT, HR, admin, account, and asset requests in one place with clear ownership.",
    singular: "ticket",
    titleLabel: "Issue",
    descriptionLabel: "Request details",
    statuses: ["open", "triaged", "in_progress", "resolved", "closed"],
    priorities: ["low", "normal", "high", "urgent"],
    showDueDate: true,
    tagHint: "it, hr, admin"
  },
  calendar: {
    eyebrow: "Planning",
    title: "Company Calendar",
    description: "Track holidays, releases, events, leave visibility, and shared office dates.",
    singular: "event",
    titleLabel: "Event",
    descriptionLabel: "Event notes",
    statuses: ["planned", "confirmed", "done", "cancelled"],
    priorities: ["normal", "important"],
    showStartDate: true,
    showDueDate: true,
    tagHint: "holiday, release, meeting"
  }
};

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100";
const activeTaskTimerKey = "office-tracker-active-task-timer";

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function emptyForm(config: Config) {
  return {
    title: "",
    description: "",
    status: config.statuses[0],
    priority: config.priorities[0],
    startDate: "",
    dueDate: "",
    amount: "",
    tags: "",
    assigneeId: "",
    managerId: "",
    clientName: "",
    taskCategory: "Development",
    stagingUrl: "",
    stagingUsername: "",
    stagingPassword: ""
  };
}

export function WorkspaceItemsPageClient({
  type,
  canCreate = true,
  taskAssignmentMode = "none",
  currentUserName = "Team member",
  displayMode = "full",
  canEditTasks = true
}: {
  type: WorkspaceToolType;
  canCreate?: boolean;
  taskAssignmentMode?: "none" | "members" | "all";
  currentUserName?: string;
  displayMode?: "full" | "create" | "list";
  canEditTasks?: boolean;
}) {
  const config = workspacePageConfigs[type];
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [form, setForm] = useState(() => emptyForm(config));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [taskUsers, setTaskUsers] = useState<Assignee[]>([]);
  const [editingItem, setEditingItem] = useState<WorkspaceItem | null>(null);
  const [editForm, setEditForm] = useState(() => emptyForm(config));
  const [activeTimer, setActiveTimer] = useState<ActiveTaskTimer | null>(null);
  const [timerNow, setTimerNow] = useState(Date.now());
  const [commentText, setCommentText] = useState("");
  const editEditorRef = useRef<HTMLDivElement | null>(null);
  const taskEditorRef = useRef<HTMLDivElement | null>(null);
  const isTaskCreateOnly = type === "task" && displayMode === "create";
  const isListOnly = displayMode === "list";
  const isCompactTaskBoard = type === "task" && displayMode === "list";

  useEffect(() => {
    function syncTimer() {
      const stored = window.localStorage.getItem(activeTaskTimerKey);
      setActiveTimer(stored ? (JSON.parse(stored) as ActiveTaskTimer) : null);
    }

    syncTimer();
    window.addEventListener("office-tracker:task-timer-updated", syncTimer);
    window.addEventListener("storage", syncTimer);
    const interval = window.setInterval(() => setTimerNow(Date.now()), 1000);

    return () => {
      window.removeEventListener("office-tracker:task-timer-updated", syncTimer);
      window.removeEventListener("storage", syncTimer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      setMessage("");

      try {
        const response = await fetch(`/api/workspace-items?type=${type}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Could not load items.");
        }

        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Could not load items.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadItems();
    return () => {
      cancelled = true;
    };
  }, [type]);

  useEffect(() => {
    let cancelled = false;

    async function loadAssignees() {
      if (type !== "task") {
        setAssignees([]);
        setTaskUsers([]);
        return;
      }

      try {
        const response = await fetch("/api/directory", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Could not load assignees.");
        }

        const users = Array.isArray(data.users) ? (data.users as Assignee[]) : [];
        setTaskUsers(users);
        const filteredUsers = taskAssignmentMode === "none" ? [] : taskAssignmentMode === "members" ? users.filter((user) => user.role === "member") : users;

        if (!cancelled) {
          setAssignees(filteredUsers);
        }
      } catch {
        if (!cancelled) {
          setAssignees([]);
        }
      }
    }

    void loadAssignees();
    return () => {
      cancelled = true;
    };
  }, [taskAssignmentMode, type]);

  const assigneeMap = useMemo(() => new Map(assignees.map((assignee) => [assignee.id, assignee])), [assignees]);
  const managerOptions = useMemo(
    () => taskUsers.filter((user) => ["manager", "admin", "owner", "super_admin"].includes(user.role)),
    [taskUsers]
  );

  function formatRichText(command: "bold" | "italic" | "underline" | "insertUnorderedList" | "removeFormat") {
    taskEditorRef.current?.focus();
    document.execCommand(command);
    setForm((value) => ({ ...value, description: taskEditorRef.current?.innerHTML ?? value.description }));
  }

  function highlightRichText(color: string) {
    taskEditorRef.current?.focus();
    document.execCommand("backColor", false, color);
    setForm((value) => ({ ...value, description: taskEditorRef.current?.innerHTML ?? value.description }));
  }

  function sanitizeRichText(value: string) {
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "");
  }

  function getTimerSeconds(timer: ActiveTaskTimer) {
    return timer.accumulatedSeconds + Math.floor((timerNow - timer.startedAt) / 1000);
  }

  function setStoredTimer(timer: ActiveTaskTimer | null) {
    if (timer) {
      window.localStorage.setItem(activeTaskTimerKey, JSON.stringify(timer));
    } else {
      window.localStorage.removeItem(activeTaskTimerKey);
    }

    setActiveTimer(timer);
    window.dispatchEvent(new Event("office-tracker:task-timer-updated"));
  }

  function startTaskTimer(item: WorkspaceItem) {
    const metadata = item.metadata as TaskMetadata;
    setStoredTimer({
      taskId: item.id,
      title: item.title,
      startedAt: Date.now(),
      accumulatedSeconds: Number(metadata.timeSpentSeconds ?? 0)
    });

    void updateTaskWorkState(item, "in_progress", Number(metadata.timeSpentSeconds ?? 0), false);
  }

  async function stopTaskTimer(item: WorkspaceItem) {
    if (!activeTimer || activeTimer.taskId !== item.id) {
      return;
    }

    const totalSeconds = getTimerSeconds(activeTimer);
    setStoredTimer(null);
    await updateTaskWorkState(item, "in_progress", totalSeconds, false);
  }

  async function finishTask(item: WorkspaceItem) {
    const totalSeconds = activeTimer?.taskId === item.id ? getTimerSeconds(activeTimer) : Number((item.metadata as TaskMetadata).timeSpentSeconds ?? 0);

    if (activeTimer?.taskId === item.id) {
      setStoredTimer(null);
    }

    await updateTaskWorkState(item, "review", totalSeconds, true);
  }

  async function updateTaskWorkState(item: WorkspaceItem, status: string, timeSpentSeconds: number, submitted: boolean) {
    const previous = items;
    const nextMetadata = {
      ...(item.metadata ?? {}),
      timeSpentSeconds,
      ...(submitted ? { submittedAt: new Date().toISOString() } : {})
    };

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              status,
              metadata: nextMetadata
            }
          : currentItem
      )
    );

    try {
      const response = await fetch(`/api/workspace-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, metadata: nextMetadata })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Could not update task.");
      }

      if (data.item) {
        setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? data.item : currentItem)));
      }
    } catch (error) {
      setItems(previous);
      setMessage(error instanceof Error ? error.message : "Could not update task.");
    }
  }

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return items.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const haystack = `${item.title} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [items, query, statusFilter]);

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/workspace-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...form,
          amount: form.amount ? Number(form.amount) : 0,
          assigneeId: type === "task" ? form.assigneeId : "",
          metadata:
            type === "task"
              ? {
                  managerId: form.managerId,
                  managerName: managerOptions.find((manager) => manager.id === form.managerId)?.name ?? "",
                  clientName: form.clientName,
                  category: form.taskCategory,
                  stagingUrl: form.stagingUrl,
                  stagingUsername: form.stagingUsername,
                  stagingPassword: form.stagingPassword,
                  assignedBy: currentUserName
                }
              : {},
          tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Could not save item.");
      }

      setItems((current) => [data.item, ...current]);
      setForm(emptyForm(config));
      if (taskEditorRef.current) {
        taskEditorRef.current.innerHTML = "";
      }
      setMessage(`${formatLabel(config.singular)} created.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save item.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(item: WorkspaceItem, status: string) {
    const previous = items;
    setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? { ...currentItem, status } : currentItem)));

    try {
      const response = await fetch(`/api/workspace-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || "Could not update item.");
      }
    } catch (error) {
      setItems(previous);
      setMessage(error instanceof Error ? error.message : "Could not update item.");
    }
  }

  async function deleteItem(id: string) {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));

    try {
      const response = await fetch(`/api/workspace-items/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || "Could not delete item.");
      }
    } catch (error) {
      setItems(previous);
      setMessage(error instanceof Error ? error.message : "Could not delete item.");
    }
  }

  function openTaskEditor(item: WorkspaceItem) {
    const metadata = item.metadata as TaskMetadata;
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      startDate: item.startDate,
      dueDate: item.dueDate,
      amount: item.amount ? String(item.amount) : "",
      tags: item.tags.join(", "),
      assigneeId: item.assigneeId,
      managerId: metadata.managerId ?? "",
      clientName: metadata.clientName ?? "",
      taskCategory: metadata.category ?? "Development",
      stagingUrl: metadata.stagingUrl ?? "",
      stagingUsername: metadata.stagingUsername ?? "",
      stagingPassword: metadata.stagingPassword ?? ""
    });

    window.setTimeout(() => {
      if (editEditorRef.current) {
        editEditorRef.current.innerHTML = item.description;
      }
    }, 0);
  }

  async function saveTaskEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/workspace-items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          status: editForm.status,
          priority: editForm.priority,
          startDate: editForm.startDate,
          dueDate: editForm.dueDate,
          amount: editForm.amount ? Number(editForm.amount) : 0,
          assigneeId: editForm.assigneeId,
          tags: editForm.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          metadata: {
            ...(editingItem.metadata ?? {}),
            managerId: editForm.managerId,
            managerName: managerOptions.find((manager) => manager.id === editForm.managerId)?.name ?? "",
            clientName: editForm.clientName,
            category: editForm.taskCategory,
            stagingUrl: editForm.stagingUrl,
            stagingUsername: editForm.stagingUsername,
            stagingPassword: editForm.stagingPassword
          }
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Could not update task.");
      }

      setItems((current) => current.map((item) => (item.id === editingItem.id ? data.item : item)));
      setEditingItem(null);
      setMessage("Task updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update task.");
    } finally {
      setSaving(false);
    }
  }

  async function addTaskComment() {
    if (!editingItem || !commentText.trim()) {
      return;
    }

    const metadata = editingItem.metadata as TaskMetadata;
    const comments = Array.isArray(metadata.comments) ? metadata.comments : [];
    const nextComment = {
      id: crypto.randomUUID(),
      author: currentUserName,
      message: commentText.trim().slice(0, 2000),
      createdAt: new Date().toISOString()
    };
    const nextMetadata = {
      ...metadata,
      comments: [...comments, nextComment]
    };

    setCommentText("");
    setEditingItem({ ...editingItem, metadata: nextMetadata });
    setItems((current) => current.map((item) => (item.id === editingItem.id ? { ...item, metadata: nextMetadata } : item)));

    try {
      const response = await fetch(`/api/workspace-items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: nextMetadata })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Could not add comment.");
      }

      if (data.item) {
        setEditingItem(data.item);
        setItems((current) => current.map((item) => (item.id === editingItem.id ? data.item : item)));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add comment.");
    }
  }

  function formatEditRichText(command: "bold" | "italic" | "underline" | "insertUnorderedList" | "removeFormat") {
    editEditorRef.current?.focus();
    document.execCommand(command);
    setEditForm((value) => ({ ...value, description: editEditorRef.current?.innerHTML ?? value.description }));
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 lg:px-8">
      <PageHeader
        eyebrow={config.eyebrow}
        title={isTaskCreateOnly ? "Give New Task" : config.title}
        description={
          isTaskCreateOnly
            ? "Create a complete task brief with manager, client, assignee, category, staging access, and detailed formatted instructions."
            : config.description
        }
      />

      <section className={`grid gap-5 ${canCreate && !isTaskCreateOnly && !isListOnly ? "xl:grid-cols-[420px_1fr]" : ""}`}>
        {canCreate && !isListOnly ? (
        <form onSubmit={createItem} className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${isTaskCreateOnly ? "mx-auto w-full max-w-[1040px] lg:p-7" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">New {config.singular}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{items.length} total</span>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">{config.titleLabel}</span>
              <input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} className={`mt-2 ${inputClass}`} required />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">{config.descriptionLabel}</span>
              {type === "task" ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
                    <button type="button" onClick={() => formatRichText("bold")} className="rounded-xl px-3 py-2 text-xs font-black text-slate-700 hover:bg-white">
                      B
                    </button>
                    <button type="button" onClick={() => formatRichText("italic")} className="rounded-xl px-3 py-2 text-xs font-bold italic text-slate-700 hover:bg-white">
                      I
                    </button>
                    <button type="button" onClick={() => formatRichText("underline")} className="rounded-xl px-3 py-2 text-xs font-bold underline text-slate-700 hover:bg-white">
                      U
                    </button>
                    <button type="button" onClick={() => formatRichText("insertUnorderedList")} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-white">
                      List
                    </button>
                    <button type="button" onClick={() => highlightRichText("#fef08a")} className="rounded-xl bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-900 hover:bg-yellow-200">
                      Yellow
                    </button>
                    <button type="button" onClick={() => highlightRichText("#bbf7d0")} className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-200">
                      Green
                    </button>
                    <button type="button" onClick={() => formatRichText("removeFormat")} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-white">
                      Clear
                    </button>
                  </div>
                  <div
                    ref={taskEditorRef}
                    contentEditable
                    onInput={() => setForm((value) => ({ ...value, description: taskEditorRef.current?.innerHTML ?? "" }))}
                    className={`${isTaskCreateOnly ? "min-h-80" : "min-h-40"} px-4 py-3 text-sm leading-6 text-slate-800 outline-none empty:before:text-slate-400 empty:before:content-['Write_task_details,_steps,_acceptance_criteria...']`}
                  />
                </div>
              ) : (
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
                  className={`mt-2 min-h-32 resize-y ${inputClass}`}
                />
              )}
            </label>

            {type === "task" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Task brief</p>
                <div className="mt-4 grid gap-3">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Manager</span>
                    <select value={form.managerId} onChange={(event) => setForm((value) => ({ ...value, managerId: event.target.value }))} className={`mt-2 ${inputClass}`}>
                      <option value="">Select manager</option>
                      {managerOptions.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name} - {manager.designation || formatLabel(manager.role)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Client name</span>
                    <input value={form.clientName} onChange={(event) => setForm((value) => ({ ...value, clientName: event.target.value }))} className={`mt-2 ${inputClass}`} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Task category</span>
                    <select value={form.taskCategory} onChange={(event) => setForm((value) => ({ ...value, taskCategory: event.target.value }))} className={`mt-2 ${inputClass}`}>
                      {["Development", "Design", "QA", "Bug Fix", "Content", "Deployment", "Research", "Support"].map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Staging access</p>
                    <div className="mt-3 grid gap-3">
                      <input value={form.stagingUrl} onChange={(event) => setForm((value) => ({ ...value, stagingUrl: event.target.value }))} placeholder="URL" className={inputClass} />
                      <input value={form.stagingUsername} onChange={(event) => setForm((value) => ({ ...value, stagingUsername: event.target.value }))} placeholder="Username" className={inputClass} />
                      <input value={form.stagingPassword} onChange={(event) => setForm((value) => ({ ...value, stagingPassword: event.target.value }))} placeholder="Password or access note" className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Status</span>
                <select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value }))} className={`mt-2 ${inputClass}`}>
                  {config.statuses.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Priority</span>
                <select value={form.priority} onChange={(event) => setForm((value) => ({ ...value, priority: event.target.value }))} className={`mt-2 ${inputClass}`}>
                  {config.priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {formatLabel(priority)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {(config.showStartDate || config.showDueDate) ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {config.showStartDate ? (
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Start date</span>
                    <input type="date" value={form.startDate} onChange={(event) => setForm((value) => ({ ...value, startDate: event.target.value }))} className={`mt-2 ${inputClass}`} />
                  </label>
                ) : null}
                {config.showDueDate ? (
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Due date</span>
                    <input type="date" value={form.dueDate} onChange={(event) => setForm((value) => ({ ...value, dueDate: event.target.value }))} className={`mt-2 ${inputClass}`} />
                  </label>
                ) : null}
              </div>
            ) : null}

            {type === "task" && taskAssignmentMode !== "none" ? (
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Assign to</span>
                <select value={form.assigneeId} onChange={(event) => setForm((value) => ({ ...value, assigneeId: event.target.value }))} className={`mt-2 ${inputClass}`}>
                  <option value="">Unassigned</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name} - {assignee.designation || assignee.role}
                    </option>
                  ))}
                </select>
                {taskAssignmentMode === "members" ? <span className="mt-2 block text-xs font-semibold text-slate-500">Coordinators can assign tasks to members only.</span> : null}
              </label>
            ) : null}

            {config.showAmount ? (
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">{config.amountLabel ?? "Amount"}</span>
                <input type="number" value={form.amount} onChange={(event) => setForm((value) => ({ ...value, amount: event.target.value }))} className={`mt-2 ${inputClass}`} />
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Tags</span>
              <input
                value={form.tags}
                onChange={(event) => setForm((value) => ({ ...value, tags: event.target.value }))}
                placeholder={config.tagHint}
                className={`mt-2 ${inputClass}`}
              />
            </label>

            <button type="submit" disabled={saving} className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : `Create ${config.singular}`}
            </button>
            {message ? <p className="text-sm font-semibold text-slate-500">{message}</p> : null}
          </div>
        </form>
        ) : !isListOnly ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Read-only access</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {type === "announcement"
                ? "Announcements can only be created by HR or the super admin. Published notices remain visible here for everyone."
                : "You can review existing items here, but creating new ones is not available for this role."}
            </p>
          </section>
        ) : null}

        {!isTaskCreateOnly ? (
        <section className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${isCompactTaskBoard ? "p-4" : "p-5"}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{config.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{filteredItems.length} shown</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_180px] lg:w-[520px]">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." className={inputClass} />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}>
                <option value="all">All statuses</option>
                {config.statuses.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={isCompactTaskBoard ? "mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200" : "mt-5 grid gap-3"}>
            {loading ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Loading...</p> : null}
            {!loading && filteredItems.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">No items yet.</p> : null}
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className={
                  isCompactTaskBoard
                    ? "bg-white px-4 py-3 transition hover:bg-sky-50/50"
                    : "rounded-2xl border border-slate-200 p-4 transition hover:border-sky-200 hover:bg-sky-50/30"
                }
              >
                <div className={`flex flex-col gap-3 lg:flex-row lg:justify-between ${isCompactTaskBoard ? "lg:items-center" : "lg:items-start"}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`${isCompactTaskBoard ? "text-sm" : "text-base"} font-semibold text-slate-950`}>{item.title}</h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{formatLabel(item.priority)}</span>
                    </div>
                    {type !== "task" && item.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p> : null}
                    {type === "task" && item.description && !isCompactTaskBoard ? (
                      <div
                        className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.description) }}
                      />
                    ) : null}
                    <div className={`${isCompactTaskBoard ? "mt-1 gap-x-3 gap-y-1" : "mt-3 gap-2"} flex flex-wrap text-xs font-semibold text-slate-500`}>
                      {type === "task" && (item.metadata as TaskMetadata).assignedBy ? <span>Assigned by: {(item.metadata as TaskMetadata).assignedBy}</span> : null}
                      {type === "task" && (item.metadata as TaskMetadata).managerName ? <span>Manager: {(item.metadata as TaskMetadata).managerName}</span> : null}
                      {type === "task" && (item.metadata as TaskMetadata).clientName ? <span>Client: {(item.metadata as TaskMetadata).clientName}</span> : null}
                      {type === "task" && (item.metadata as TaskMetadata).category ? <span>Category: {(item.metadata as TaskMetadata).category}</span> : null}
                      {type === "task" ? <span>Worked: {formatDuration(Number((item.metadata as TaskMetadata).timeSpentSeconds ?? 0))}</span> : null}
                      {type === "task" && (item.metadata as TaskMetadata).submittedAt ? <span>Submitted</span> : null}
                      {item.startDate ? <span>Start: {item.startDate}</span> : null}
                      {item.dueDate ? <span>Due: {item.dueDate}</span> : null}
                      {item.assigneeId ? <span>Assigned: {assigneeMap.get(item.assigneeId)?.name ?? "Team member"}</span> : null}
                      {item.amount ? <span>{config.amountLabel ?? "Amount"}: {item.amount}</span> : null}
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {type === "task" && !isCompactTaskBoard && ((item.metadata as TaskMetadata).stagingUrl || (item.metadata as TaskMetadata).stagingUsername || (item.metadata as TaskMetadata).stagingPassword) ? (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                        <p className="text-slate-900">Staging access</p>
                        {(item.metadata as TaskMetadata).stagingUrl ? (
                          <a href={(item.metadata as TaskMetadata).stagingUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sky-700 hover:text-sky-900">
                            {(item.metadata as TaskMetadata).stagingUrl}
                          </a>
                        ) : null}
                        {(item.metadata as TaskMetadata).stagingUsername ? <p className="mt-2">User: {(item.metadata as TaskMetadata).stagingUsername}</p> : null}
                        {(item.metadata as TaskMetadata).stagingPassword ? <p className="mt-1">Access: {(item.metadata as TaskMetadata).stagingPassword}</p> : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {type === "task" && isCompactTaskBoard ? (
                      activeTimer?.taskId === item.id ? (
                        <button
                          type="button"
                          onClick={() => void stopTaskTimer(item)}
                          className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
                        >
                          Stop {formatDuration(getTimerSeconds(activeTimer))}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startTaskTimer(item)}
                          disabled={item.status === "done" || item.status === "review"}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Start
                        </button>
                      )
                    ) : null}
                    {type === "task" && isCompactTaskBoard ? (
                      <button
                        type="button"
                        onClick={() => void finishTask(item)}
                        disabled={item.status === "done" || item.status === "review"}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Finish
                      </button>
                    ) : null}
                    {isCompactTaskBoard ? (
                      <button
                        type="button"
                        onClick={() => openTaskEditor(item)}
                        className="rounded-full border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-50"
                      >
                        {canEditTasks ? "Open" : "View"}
                      </button>
                    ) : null}
                    {type === "task" && !canEditTasks ? (
                      <span className={`rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 ${isCompactTaskBoard ? "px-2.5 py-1.5" : "px-3 py-2"}`}>
                        {formatLabel(item.status)}
                      </span>
                    ) : (
                      <>
                        <select
                          value={item.status}
                          onChange={(event) => void updateStatus(item, event.target.value)}
                          className={`rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 ${isCompactTaskBoard ? "px-2.5 py-1.5" : "px-3 py-2"}`}
                        >
                          {config.statuses.map((status) => (
                            <option key={status} value={status}>
                              {formatLabel(status)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void deleteItem(item.id)}
                          className={`rounded-full border border-rose-200 bg-white text-xs font-bold text-rose-700 transition hover:bg-rose-50 ${isCompactTaskBoard ? "px-2.5 py-1.5" : "px-3 py-2"}`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        ) : null}
      </section>

      {editingItem ? (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/55 px-4 py-6">
          <form onSubmit={saveTaskEdit} className="mx-auto max-w-[980px] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Task</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">{canEditTasks ? "View or edit task" : "Task details"}</h2>
              </div>
              <button type="button" onClick={() => setEditingItem(null)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Task name</span>
                <input value={editForm.title} onChange={(event) => setEditForm((value) => ({ ...value, title: event.target.value }))} disabled={!canEditTasks} className={`mt-2 ${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} required />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Client name</span>
                <input value={editForm.clientName} onChange={(event) => setEditForm((value) => ({ ...value, clientName: event.target.value }))} disabled={!canEditTasks} className={`mt-2 ${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Manager</span>
                <select value={editForm.managerId} onChange={(event) => setEditForm((value) => ({ ...value, managerId: event.target.value }))} disabled={!canEditTasks} className={`mt-2 ${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}>
                  <option value="">Select manager</option>
                  {managerOptions.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Assigned to</span>
                <select value={editForm.assigneeId} onChange={(event) => setEditForm((value) => ({ ...value, assigneeId: event.target.value }))} disabled={!canEditTasks} className={`mt-2 ${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}>
                  <option value="">Unassigned</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name} - {assignee.designation || assignee.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Status</span>
                <select value={editForm.status} onChange={(event) => setEditForm((value) => ({ ...value, status: event.target.value }))} disabled={!canEditTasks} className={`mt-2 ${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}>
                  {config.statuses.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Category</span>
                <input value={editForm.taskCategory} onChange={(event) => setEditForm((value) => ({ ...value, taskCategory: event.target.value }))} disabled={!canEditTasks} className={`mt-2 ${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} />
              </label>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {canEditTasks ? <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
                <button type="button" onClick={() => formatEditRichText("bold")} className="rounded-xl px-3 py-2 text-xs font-black text-slate-700 hover:bg-white">B</button>
                <button type="button" onClick={() => formatEditRichText("italic")} className="rounded-xl px-3 py-2 text-xs font-bold italic text-slate-700 hover:bg-white">I</button>
                <button type="button" onClick={() => formatEditRichText("underline")} className="rounded-xl px-3 py-2 text-xs font-bold underline text-slate-700 hover:bg-white">U</button>
                <button type="button" onClick={() => formatEditRichText("insertUnorderedList")} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-white">List</button>
                <button type="button" onClick={() => formatEditRichText("removeFormat")} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-white">Clear</button>
              </div> : null}
              <div
                ref={editEditorRef}
                contentEditable={canEditTasks}
                onInput={() => setEditForm((value) => ({ ...value, description: editEditorRef.current?.innerHTML ?? "" }))}
                className="min-h-72 px-4 py-3 text-sm leading-6 text-slate-800 outline-none"
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <input value={editForm.stagingUrl} onChange={(event) => setEditForm((value) => ({ ...value, stagingUrl: event.target.value }))} disabled={!canEditTasks} placeholder="Staging URL" className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} />
              <input value={editForm.stagingUsername} onChange={(event) => setEditForm((value) => ({ ...value, stagingUsername: event.target.value }))} disabled={!canEditTasks} placeholder="Username" className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} />
              <input value={editForm.stagingPassword} onChange={(event) => setEditForm((value) => ({ ...value, stagingPassword: event.target.value }))} disabled={!canEditTasks} placeholder="Password/access note" className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`} />
            </div>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-950">Comments</h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                  {((editingItem.metadata as TaskMetadata).comments ?? []).length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {((editingItem.metadata as TaskMetadata).comments ?? []).map((comment) => (
                  <div key={comment.id} className="rounded-2xl bg-white p-3 text-sm shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-950">{comment.author}</span>
                      <span className="text-xs font-semibold text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-600">{comment.message}</p>
                  </div>
                ))}
                {((editingItem.metadata as TaskMetadata).comments ?? []).length === 0 ? <p className="text-sm font-semibold text-slate-500">No comments yet.</p> : null}
              </div>
              <div className="mt-4 grid gap-3">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Write a comment or question..."
                  className="min-h-24 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
                <button type="button" onClick={() => void addTaskComment()} className="w-fit rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Add comment
                </button>
              </div>
            </section>

            <div className="mt-6 flex flex-wrap gap-3">
              {canEditTasks ? <button type="submit" disabled={saving} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                {saving ? "Saving..." : "Save task"}
              </button> : null}
              <button type="button" onClick={() => setEditingItem(null)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                {canEditTasks ? "Cancel" : "Close"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
