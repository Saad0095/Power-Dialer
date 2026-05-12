import { BadgeDollarSign } from "lucide-react";

export default function ClientMarketplacePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50 to-emerald-50 p-8 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-600 text-white shadow-lg shadow-cyan-500/20">
            <BadgeDollarSign className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Offer Marketplace
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Browse additional lead offers when the marketplace opens.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Marketplace access is coming soon. In the meantime, check your assigned offers.
      </div>
    </div>
  );
}
