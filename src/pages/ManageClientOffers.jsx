import { useCallback, useEffect, useState } from "react";
import { Layers3, Plus, Search } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  getManagerOffers,
  getQualifiedLeadsPool as loadQualifiedLeadsPool,
} from "../services/api";
import CreateOfferModal from "../components/CreateOfferModal";
import OffersManagementTable from "../components/OffersManagementTable";
import QualifiedLeadsTable from "../components/QualifiedLeadsTable";
import LeadDetailsModal from "../components/LeadDetailsModal";

const QUALIFIED_OPTIONS = [
  "",
  "qualified-level-1",
  "qualified-level-2",
  "qualified-level-3",
];

export default function ManageClientOffers() {
  const { user } = useAuth();
  const { showNotification } = useOutletContext();
  const canManageOffers = ["admin", "manager"].includes(user?.role);
  const [leadFilters, setLeadFilters] = useState({
    search: "",
    appointmentStatus: "",
    page: 1,
    limit: 8,
  });
  const [offerFilters, setOfferFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [qualifiedLeads, setQualifiedLeads] = useState([]);
  const [qualifiedPagination, setQualifiedPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [offers, setOffers] = useState([]);
  const [offersPagination, setOffersPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeadForPreview, setSelectedLeadForPreview] = useState(null);
  const [allowReplace, setAllowReplace] = useState(false);

  const refreshQualifiedLeads = useCallback(async () => {
    setIsLoadingLeads(true);
    try {
      const data = await loadQualifiedLeadsPool(leadFilters);
      setQualifiedLeads(data.items || []);
      setQualifiedPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error("Failed to load qualified leads", error);
      showNotification("Failed to load qualified leads", "error");
    } finally {
      setIsLoadingLeads(false);
    }
  }, [leadFilters, showNotification]);

  const refreshOffers = useCallback(async () => {
    setIsLoadingOffers(true);
    try {
      const data = await getManagerOffers(offerFilters);
      setOffers(data.items || []);
      setOffersPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error("Failed to load offers", error);
      showNotification("Failed to load offers", "error");
    } finally {
      setIsLoadingOffers(false);
    }
  }, [offerFilters, showNotification]);

  useEffect(() => {
    refreshQualifiedLeads();
  }, [refreshQualifiedLeads]);

  useEffect(() => {
    refreshOffers();
  }, [refreshOffers]);

  const handleOfferCreated = () => {
    refreshQualifiedLeads();
    refreshOffers();
    setAllowReplace(false);
  };

  const handleOfferCancelled = () => {
    refreshQualifiedLeads();
    refreshOffers();
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-8 shadow-lg dark:border-slate-700/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-3xl"></div>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
              <Layers3 className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Manage Client Offers
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Convert qualified caller leads into governed client offers with controlled masking and lifecycle tracking.
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-600/50 dark:bg-slate-900/80 dark:text-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <Layers3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span>{offers.filter((offer) => offer.status === "offered").length} active offers</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Qualified Pool
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {qualifiedPagination.total}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Total Offers
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {offersPagination.total}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Offered Queue
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {offers.filter((offer) => offer.status === "offered").length}
          </p>
        </div>
      </div>

      <QualifiedLeadsTable
        leads={qualifiedLeads}
        filters={leadFilters}
        onFiltersChange={setLeadFilters}
        pagination={qualifiedPagination}
        onPageChange={(page) =>
          setLeadFilters((prev) => ({ ...prev, page }))
        }
        onCreateOffer={(lead, options = {}) => {
          setAllowReplace(Boolean(options.allowReplace));
          setSelectedLead(lead);
        }}
        onViewLead={setSelectedLeadForPreview}
        isLoading={isLoadingLeads}
      />

      <OffersManagementTable
        offers={offers}
        filters={offerFilters}
        onFiltersChange={setOfferFilters}
        pagination={offersPagination}
        onPageChange={(page) =>
          setOfferFilters((prev) => ({ ...prev, page }))
        }
        onOfferCancelled={handleOfferCancelled}
        onReassignOffer={(offer) => {
          setAllowReplace(true);
          setSelectedLead(offer?.lead || null);
        }}
        showNotification={showNotification}
        isLoading={isLoadingOffers}
      />

      <CreateOfferModal
        isOpen={Boolean(selectedLead)}
        lead={selectedLead}
        allowReplace={allowReplace}
        onClose={() => {
          setSelectedLead(null);
          setAllowReplace(false);
        }}
        onCreated={handleOfferCreated}
        showNotification={showNotification}
      />

      <LeadDetailsModal
        isOpen={Boolean(selectedLeadForPreview)}
        lead={selectedLeadForPreview}
        canManageOffers={canManageOffers}
        onCreateOffer={(lead, options = {}) => {
          setAllowReplace(Boolean(options.allowReplace));
          setSelectedLead(lead);
        }}
        onClose={() => setSelectedLeadForPreview(null)}
      />
    </div>
  );
}
