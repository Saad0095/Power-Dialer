import { useEffect, useState } from "react";
import { Save, UserRound } from "lucide-react";
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
    startTime: "09:00",
    endTime: "17:00",
  }));

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
      availabilityCalendar:
        Array.isArray(user.availabilityCalendar) && user.availabilityCalendar.length
          ? user.availabilityCalendar
          : buildDefaultCalendar(),
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
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50 to-emerald-50 p-8 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-600 text-white shadow-lg shadow-cyan-500/20">
            <UserRound className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Client Profile
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Keep your business details and weekly availability current so lead coordination stays accurate.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Business Details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
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
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
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
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Availability Calendar</h2>
          <div className="mt-5 space-y-3">
            {form.availabilityCalendar.map((entry) => (
              <div
                key={entry.day}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[160px_120px_1fr_1fr] md:items-center dark:border-slate-700 dark:bg-slate-900/50"
              >
                <div className="text-sm font-semibold capitalize text-slate-900 dark:text-white">
                  {entry.day}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
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
                <input
                  type="time"
                  value={entry.startTime || ""}
                  disabled={!entry.isAvailable}
                  onChange={(event) =>
                    updateCalendarEntry(entry.day, "startTime", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
                />
                <input
                  type="time"
                  value={entry.endTime || ""}
                  disabled={!entry.isAvailable}
                  onChange={(event) =>
                    updateCalendarEntry(entry.day, "endTime", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
                />
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
