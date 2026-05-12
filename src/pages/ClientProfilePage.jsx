import { useEffect, useState } from "react";
import { Save, UserRound, ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { updateMyProfile } from "../services/api";
import { useOutletContext } from "react-router-dom";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const buildDefaultCalendar = () =>
  DAYS.map((day, index) => ({
    day,
    isAvailable: index < 5,
    slots: [{ startTime: "09:00", endTime: "17:00" }],
  }));

const normalizeCalendarForForm = (calendar) => {
  const entriesByDay = new Map();

  if (Array.isArray(calendar)) {
    for (const entry of calendar) {
      const day = String(entry?.day || "").toLowerCase();
      if (day) entriesByDay.set(day, entry);
    }
  }

  return DAYS.map((day, index) => {
    const entry = entriesByDay.get(day) || {};
    const rawSlots = Array.isArray(entry.slots) ? entry.slots : [];
    const fallbackSlot = {
      startTime: entry.startTime || "09:00",
      endTime: entry.endTime || "17:00",
    };
    const slots = (rawSlots.length ? rawSlots : [fallbackSlot]).map((slot) => ({
      startTime: slot?.startTime || "",
      endTime: slot?.endTime || "",
    }));

    return {
      day,
      isAvailable: entry.isAvailable ?? index < 5,
      slots,
    };
  });
};

function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </section>
  );
}

export default function ClientProfilePage() {
  const { user, hydrateAuth } = useAuth();
  const { showNotification } = useOutletContext();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    timezone: "Asia/Karachi",
    companyName: "",
    website: "",
    businessAddress: "",
    city: "",
    state: "",
    country: "",
    profileNotes: "",
    availabilityCalendar: buildDefaultCalendar(),
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      timezone: user.timezone || "Asia/Karachi",
      companyName: user.companyName || "",
      website: user.website || "",
      businessAddress: user.businessAddress || "",
      city: user.city || "",
      state: user.state || "",
      country: user.country || "",
      profileNotes: user.profileNotes || "",
      availabilityCalendar: normalizeCalendarForForm(user.availabilityCalendar),
    });
  }, [user]);

  const updateCalendarEntry = (day, key, value) => {
    setForm((prev) => ({
      ...prev,
      availabilityCalendar: prev.availabilityCalendar.map((entry) =>
        entry.day === day ? { ...entry, [key]: value } : entry,
      ),
    }));
  };

  const updateCalendarSlot = (day, index, key, value) => {
    setForm((prev) => ({
      ...prev,
      availabilityCalendar: prev.availabilityCalendar.map((entry) => {
        if (entry.day !== day) return entry;
        const nextSlots = entry.slots.map((slot, slotIndex) =>
          slotIndex === index ? { ...slot, [key]: value } : slot,
        );
        return { ...entry, slots: nextSlots };
      }),
    }));
  };

  const addCalendarSlot = (day) => {
    setForm((prev) => ({
      ...prev,
      availabilityCalendar: prev.availabilityCalendar.map((entry) =>
        entry.day === day
          ? { ...entry, slots: [...entry.slots, { startTime: "", endTime: "" }] }
          : entry,
      ),
    }));
  };

  const removeCalendarSlot = (day, index) => {
    setForm((prev) => ({
      ...prev,
      availabilityCalendar: prev.availabilityCalendar.map((entry) => {
        if (entry.day !== day) return entry;
        const nextSlots = entry.slots.filter((_, slotIndex) => slotIndex !== index);
        return { ...entry, slots: nextSlots.length ? nextSlots : entry.slots };
      }),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await updateMyProfile(form);
      await hydrateAuth?.();
      showNotification("Profile updated successfully", "success");
    } catch (error) {
      console.error("Failed to update profile", error);
      showNotification(
        error.response?.data?.error || "Failed to update profile",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50 to-blue-50 p-8 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 text-white">
            <UserRound className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Client Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Keep your business details and weekly availability current so lead coordination stays accurate.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Details */}
        <CollapsibleSection title="Business Details">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["name", "Full Name"],
              ["email", "Email"],
              ["phoneNumber", "Phone Number"],
              ["companyName", "Company Name"],
              ["website", "Website"],
              ["timezone", "Timezone"],
              ["city", "City"],
              ["state", "State"],
              ["country", "Country"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {label}
                </label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [key]: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Business Address
              </label>
              <input
                type="text"
                value={form.businessAddress}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, businessAddress: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                value={form.profileNotes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, profileNotes: event.target.value }))
                }
                rows={4}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Availability Calendar */}
        <CollapsibleSection title="Availability Calendar">
          <div className="space-y-3">
            {form.availabilityCalendar.map((entry) => (
              <div
                key={entry.day}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold capitalize text-slate-900 dark:text-white">
                    {entry.day}
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={entry.isAvailable}
                      onChange={(event) =>
                        updateCalendarEntry(entry.day, "isAvailable", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    Available
                  </label>
                  <button
                    type="button"
                    onClick={() => addCalendarSlot(entry.day)}
                    disabled={!entry.isAvailable}
                    className="cursor-pointer rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-700/40 dark:bg-slate-900 dark:text-cyan-200"
                  >
                    Add slot
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {entry.slots.map((slot, slotIndex) => (
                    <div
                      key={`${entry.day}-${slotIndex}`}
                      className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center"
                    >
                      <input
                        type="time"
                        value={slot.startTime || ""}
                        disabled={!entry.isAvailable}
                        onChange={(event) =>
                          updateCalendarSlot(entry.day, slotIndex, "startTime", event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
                      />
                      <input
                        type="time"
                        value={slot.endTime || ""}
                        disabled={!entry.isAvailable}
                        onChange={(event) =>
                          updateCalendarSlot(entry.day, slotIndex, "endTime", event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => removeCalendarSlot(entry.day, slotIndex)}
                        disabled={!entry.isAvailable || entry.slots.length === 1}
                        className="cursor-pointer rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-700/40 dark:bg-slate-900 dark:text-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}