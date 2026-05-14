import { useEffect, useMemo, useState } from "react";
import Modal from "./common/Modal";
import FormInput from "./common/FormInput";
import { createClientOffer, getAllAgents } from "../services/api";

const FIELD_OPTIONS = [
  "businessName",
  "contactName",
  "businessAddress",
  "city",
  "state",
  "country",
  "email",
  "phoneNumber",
  "leadFor",
  "currentSetup",
  "servicesGetting",
  "frequency",
  "currentChallenges",
  "interestLevel",
  "appointmentDate",
  "appointmentTime",
  "appointmentStatus",
  "agentNotes",
];

const DEFAULT_VISIBLE_FIELDS = [
  "businessName",
  "city",
  "state",
  "interestLevel",
  "currentSetup",
  "appointmentDate",
  "appointmentStatus",
];

const DEFAULT_MASKING = {
  emailMasked: true,
  phoneMasked: true,
  addressMasked: true,
};

export default function CreateOfferModal({
  isOpen,
  lead,
  allowReplace = false,
  onClose,
  onCreated,
  showNotification,
}) {
  const [clients, setClients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    price: "150",
    currency: "USD",
    expiresAt: "",
    visibleFields: DEFAULT_VISIBLE_FIELDS,
    fieldMasking: DEFAULT_MASKING,
    isLocked: false,
    includeInvoiceLink: false,
    invoiceLink: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    const loadClients = async () => {
      setIsLoadingClients(true);
      try {
        const users = await getAllAgents({ includeClients: true });
        setClients(
          (Array.isArray(users) ? users : [])
            .filter((user) => user.role === "client")
            .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)),
        );
      } catch (error) {
        console.error("Failed to load clients", error);
        showNotification?.("Failed to load clients", "error");
      } finally {
        setIsLoadingClients(false);
      }
    };

    loadClients();
  }, [isOpen, showNotification]);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      clientId: "",
      price: "150",
      currency: "USD",
      expiresAt: "",
      visibleFields: DEFAULT_VISIBLE_FIELDS,
      fieldMasking: DEFAULT_MASKING,
      isLocked: false,
      includeInvoiceLink: false,
      invoiceLink: "",
    });
  }, [isOpen, lead?._id]);

  const selectedClient = useMemo(
    () => clients.find((client) => client._id === form.clientId) || null,
    [clients, form.clientId],
  );

  const toggleVisibleField = (field) => {
    setForm((prev) => {
      const exists = prev.visibleFields.includes(field);
      return {
        ...prev,
        visibleFields: exists
          ? prev.visibleFields.filter((item) => item !== field)
          : [...prev.visibleFields, field],
      };
    });
  };

  const toggleMask = (key) => {
    setForm((prev) => ({
      ...prev,
      fieldMasking: {
        ...prev.fieldMasking,
        [key]: !prev.fieldMasking[key],
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!lead?._id) {
      showNotification?.("Invalid lead selected", "error");
      return;
    }

    if (!form.clientId) {
      showNotification?.("Please choose a client", "error");
      return;
    }

    if (!form.visibleFields.length) {
      showNotification?.("Select at least one visible field", "error");
      return;
    }

    setIsSubmitting(true);
    try {
        const payload = {
          leadId: lead._id,
          clientId: form.clientId,
          price: Number(form.price),
          currency: form.currency,
          ...(form.expiresAt
            ? { expiresAt: new Date(form.expiresAt).toISOString() }
            : {}),
          visibleFields: form.visibleFields,
          fieldMasking: form.fieldMasking,
          isLocked: form.isLocked,
          invoiceLink: form.includeInvoiceLink ? form.invoiceLink : null,
        };

      const created = await createClientOffer({
        ...payload,
        ...(allowReplace ? { allowReplace: true } : {}),
      });
      showNotification?.("Offer created successfully", "success");
      onCreated?.(created);
      onClose?.();
    } catch (error) {
      console.error("Failed to create offer", error);
      showNotification?.(
        error.response?.data?.error || "Failed to create offer",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={allowReplace ? "Reassign Client Offer" : "Create Client Offer"}
      maxWidth="max-w-3xl"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Lead
          </p>
          <div className="mt-2 flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {lead?.businessName || "Unnamed lead"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {lead?.contactName || "No contact"} • {lead?.city || "Unknown city"},{" "}
              {lead?.state || "Unknown state"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Qualification: {lead?.appointmentStatus || "Unknown"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Assign Client
            </label>
            <select
              value={form.clientId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, clientId: event.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">
                {isLoadingClients ? "Loading clients..." : "Select client"}
              </option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name || client.email} ({client.email})
                </option>
              ))}
            </select>
            {selectedClient && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Assigning to {selectedClient.name || selectedClient.email}
              </p>
            )}
          </div>

          <FormInput
            label="Price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, price: event.target.value }))
            }
          />

          <FormInput
            label="Currency"
            name="currency"
            value={form.currency}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))
            }
          />

          <FormInput
            label="Expires At"
            name="expiresAt"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, expiresAt: event.target.value }))
            }
          />
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Lead Access
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Determine if the client sees full details immediately.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, isLocked: false }))}
                className={`rounded-md px-4 py-1.5 text-xs font-medium transition ${
                  !form.isLocked
                    ? "bg-cyan-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                Unlocked
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, isLocked: true }))}
                className={`rounded-md px-4 py-1.5 text-xs font-medium transition ${
                  form.isLocked
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                Locked
              </button>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.includeInvoiceLink}
                onChange={(e) => setForm(prev => ({ ...prev, includeInvoiceLink: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Include Invoice Link in Email
              </span>
            </label>
            {form.includeInvoiceLink && (
              <div className="mt-3">
                <FormInput
                  label="Invoice URL"
                  placeholder="https://..."
                  value={form.invoiceLink}
                  onChange={(e) => setForm(prev => ({ ...prev, invoiceLink: e.target.value }))}
                />
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Leave expiry empty if this offer should stay open until it is paid, cancelled, or manually handled.
        </p>

        {allowReplace && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            Creating this offer will cancel the current active offer for this lead.
          </div>
        )}

        {form.isLocked && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Visible Fields
              </p>
              <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                {FIELD_OPTIONS.map((field) => {
                  const checked = form.visibleFields.includes(field);
                  return (
                    <label
                      key={field}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleVisibleField(field)}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>{field}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Masking Controls
                </p>
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  {[
                    ["emailMasked", "Mask email"],
                    ["phoneMasked", "Mask phone number"],
                    ["addressMasked", "Mask street address"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm dark:bg-slate-800"
                    >
                      <span className="text-slate-700 dark:text-slate-200">{label}</span>
                      <input
                        type="checkbox"
                        checked={form.fieldMasking[key]}
                        onChange={() => toggleMask(key)}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-100">
                Clients only see masked data from the offer snapshot. They do not get direct
                access to `CallerLead`.
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Offer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
