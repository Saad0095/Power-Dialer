import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNotificationContext } from "../context/NotificationContext";
import { createTask, deleteTask, getTasks, getUsers, updateTask } from "../services/api";
import { getRoleHomeRoute } from "../utils/roleUtils";

const ASSIGNABLE_ROLES = new Set(["caller-agent", "team-lead", "scrapper"]);

function formatDateTime(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleString();
}

export default function MyTasksPage() {
  const navigate = useNavigate();
  const { showNotification } = useOutletContext() || {};
  const { user } = useAuth();
  const { notifications } = useNotificationContext();
  const [searchParams] = useSearchParams();
  const highlightedTaskId = searchParams.get("taskId") || "";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    highlightedTaskId ? "all" : "pending",
  );
  const [assignees, setAssignees] = useState([]);
  const [form, setForm] = useState({
    userId: "",
    title: "",
    description: "",
    dueAt: "",
  });
  const [creating, setCreating] = useState(false);

  const canAssignTasks = ["admin", "manager"].includes(user?.role);
  const basePath = getRoleHomeRoute(user?.role);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await getTasks(
          statusFilter === "all" ? "" : statusFilter,
          highlightedTaskId,
        );
        setTasks(data.tasks || []);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        showNotification?.("Failed to load tasks", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [highlightedTaskId, notifications.length, showNotification, statusFilter]);

  useEffect(() => {
    if (!canAssignTasks) return;

    const loadAssignees = async () => {
      try {
        const users = await getUsers();
        const availableAssignees = (users || []).filter((entry) =>
          ASSIGNABLE_ROLES.has(entry.role),
        );
        setAssignees(availableAssignees);
        setForm((prev) => ({
          ...prev,
          userId: prev.userId || availableAssignees[0]?._id || "",
        }));
      } catch (error) {
        console.error("Failed to fetch assignees:", error);
      }
    };

    loadAssignees();
  }, [canAssignTasks]);

  const pendingCount = useMemo(
    () => tasks.filter((task) => task.status === "pending").length,
    [tasks],
  );
  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === "completed").length,
    [tasks],
  );

  const openTaskTarget = (task) => {
    if (task?.relatedLead || task?.metadata?.leadId) {
      const leadId = task.relatedLead || task.metadata?.leadId;
      const route =
        ["admin", "manager", "team-lead"].includes(user?.role)
          ? `${basePath}/caller-leads?leadId=${leadId}`
          : `${basePath}/followups?leadId=${leadId}`;
      navigate(route);
      return;
    }

    if (task?.relatedCampaign || task?.metadata?.campaignId) {
      navigate(
        ["admin", "manager", "team-lead"].includes(user?.role)
          ? `${basePath}/campaigns`
          : `${basePath}/auto-dialer`,
      );
      return;
    }

    navigate(`${basePath}/notifications`);
  };

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";

    try {
      setSavingTaskId(task._id);
      const response = await updateTask(task._id, { status: nextStatus });
      setTasks((prev) =>
        prev.map((entry) =>
          entry._id === task._id
            ? response.task || { ...entry, status: nextStatus }
            : entry,
        ),
      );
    } catch (error) {
      console.error("Failed to update task:", error);
      showNotification?.("Failed to update task", "error");
    } finally {
      setSavingTaskId("");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setSavingTaskId(taskId);
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      showNotification?.("Task deleted", "success");
    } catch (error) {
      console.error("Failed to delete task:", error);
      showNotification?.("Failed to delete task", "error");
    } finally {
      setSavingTaskId("");
    }
  };

  const handleCreateTask = async () => {
    if (!form.userId || !form.title.trim()) return;

    try {
      setCreating(true);
      await createTask({
        userId: form.userId,
        title: form.title.trim(),
        description: form.description.trim(),
        dueAt: form.dueAt || null,
      });
      setForm({ userId: "", title: "", description: "", dueAt: "" });
      showNotification?.("Task assigned", "success");
    } catch (error) {
      console.error("Failed to assign task:", error);
      showNotification?.("Failed to assign task", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-linear-to-r from-cyan-500 to-blue-500 rounded p-2">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                My Tasks
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Actionable work from notifications and manual assignments lives here.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{tasks.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="all">All Tasks</option>
            </select>
          </div>
        </div>
      </div>

      {canAssignTasks ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-cyan-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Assign Custom Task
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.userId}
              onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value }))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select assignee</option>
              {assignees.map((assignee) => (
                <option key={assignee._id} value={assignee._id}>
                  {assignee.name} ({assignee.role})
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={form.dueAt}
              onChange={(event) => setForm((prev) => ({ ...prev, dueAt: event.target.value }))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-100"
            />

            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Task title"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-100 md:col-span-2"
            />

            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Optional instructions"
              rows={3}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-100 md:col-span-2"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreateTask}
              disabled={creating || !form.userId || !form.title.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-white font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Assign Task
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 shadow-xl p-6">
        {loading ? (
          <div className="py-14 text-center text-slate-500 dark:text-slate-400">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-14 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/20">
            <p className="font-medium text-slate-800 dark:text-slate-100">No tasks found</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              New actionable notifications will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isBusy = savingTaskId === task._id;
              const isHighlighted = highlightedTaskId === task._id;
              const canDelete = task.category === "custom";

              return (
                <div
                  key={task._id}
                  className={`rounded-xl border px-4 py-4 transition ${
                    isHighlighted
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/10"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleToggleTask(task)}
                        disabled={isBusy}
                        className="mt-0.5 text-slate-500 hover:text-cyan-600 disabled:opacity-50"
                        title={task.status === "completed" ? "Mark pending" : "Mark completed"}
                      >
                        {task.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : isBusy ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {task.title}
                          </h3>
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {task.category === "custom" ? "Custom" : "System"}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              task.status === "completed"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>

                        {task.description ? (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                            {task.description}
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>Created: {formatDateTime(task.createdAt)}</span>
                          <span>Due: {formatDateTime(task.dueAt)}</span>
                          {task.assignedBy?.name ? <span>Assigned by: {task.assignedBy.name}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 lg:ml-4">
                      {task.relatedLead ||
                      task.metadata?.leadId ||
                      task.relatedCampaign ||
                      task.metadata?.campaignId ? (
                        <button
                          onClick={() => openTaskTarget(task)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </button>
                      ) : null}

                      {canDelete ? (
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-800 px-3 py-2 text-sm text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/10 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
