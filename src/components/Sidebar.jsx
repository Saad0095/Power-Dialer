import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Megaphone,
  Phone,
  Users,
  PhoneCall,
  CalendarDays,
  Repeat2,
  MapPinned,
  ClipboardList,
  Coins,
  Repeat,
  BriefcaseBusiness,
  BadgeDollarSign,
  IdCard,
} from "lucide-react";

function getSidebarItems(role) {
  if (role === "manager" || role === "admin") {
    return [
      {
        id: "overview",
        label: "Dashboard",
        icon: LayoutGrid,
        path: "/manager",
      },
      {
        id: "tasks",
        label: "My Tasks",
        icon: ClipboardList,
        path: "/manager/tasks",
      },
      {
        id: "campaigns",
        label: "Campaigns",
        icon: Megaphone,
        path: "/manager/campaigns",
      },
      // { id: 'leads', label: 'Leads', icon: FileText, path: '/manager/leads' },
      {
        id: "caller-leads",
        label: "Manage Caller Leads",
        icon: Repeat2,
        path: "/manager/caller-leads",
      },
      {
        id: "closer-leads",
        label: "Manage Closer Leads (TBD)",
        icon: Repeat2,
        path: "/manager/closer-leads",
      },
      {
        id: "client-leads",
        label: "Manage Client Offers",
        icon: Repeat,
        path: "/manager/client-leads",
      },
      {
        id: "scraper",
        label: "Maps Scraper",
        icon: MapPinned,
        path: "/manager/scraper",
      },
      // { id: 'leads', label: 'Leads', icon: FileText, path: '/manager/leads' },
      // { id: 'followups', label: 'Lead Followups', icon: Repeat2, path: '/manager/followups' },

      {
        id: "agents",
        label: "Agents Live Status",
        icon: Users,
        path: "/manager/agents",
      },
      {
        id: "attendance",
        label: "Attendance Record",
        icon: CalendarDays,
        path: "/manager/attendance",
      },
      {
        id: "earnings",
        label: "Earnings History",
        icon: Coins,
        path: "/manager/earnings",
      },
      {
        id: "user-management",
        label: "User Management",
        icon: Users,
        path: "/manager/user-management",
      },
      
        //    {
        //   id: "call-logs",
        //   label: "Call Logs",
        //   icon: Phone,
        //   path: "/manager/call-logs",
        // },
    ];
  }

  if (role === "client") {
    return [
      {
        id: "overview",
        label: "Dashboard",
        icon: BriefcaseBusiness,
        path: "/client",
      },
      {
        id: "my-offers",
        label: "My Leads",
        icon: BriefcaseBusiness,
        path: "/client/leads",
      },
      // {
      //   id: "offers",
      //   label: "Offer Marketplace",
      //   icon: BadgeDollarSign,
      //   path: "/client/marketplace",
      // },
      {
        id: "profile",
        label: "My Profile",
        icon: IdCard,
        path: "/client/profile",
      },
    ];
  }

  if (role === "scrapper") {
    return [
      { id: "overview", label: "Maps Scraper", icon: MapPinned, path: "/scrapper" },
      {
        id: "tasks",
        label: "My Tasks",
        icon: ClipboardList,
        path: "/scrapper/tasks",
      },
      // {
      //   id: "scraper",
      //   label: "Scrape Sessions",
      //   icon: MapPinned,
      //   path: "/scrapper/scraper",
      // },
    ];
  }

  return [
    { id: "overview", label: "Dashboard", icon: LayoutGrid, path: "/agent" },
    {
      id: "tasks",
      label: "My Tasks",
      icon: ClipboardList,
      path: "/agent/tasks",
    },
    // { id: 'leads', label: 'View Leads', icon: FileText, path: '/agent/leads' },
    {
      id: "auto-dialer",
      label: "Auto Dialer",
      icon: PhoneCall,
      path: "/agent/auto-dialer",
    },
    // {
    //   id: "power-dialer",
    //   label: "Power Dialer",
    //   icon: PhoneCall,
    //   path: "/agent/power-dialer",
    // },
    {
      id: "direct-dialer",
      label: "Direct Dialer",
      icon: Phone,
      path: "/agent/direct-dialer",
    },
    // { id: 'call-logs', label: 'Call Logs', icon: Phone, path: '/agent/call-logs' },
    {
      id: "followups",
      label: "Lead Status/Followups",
      icon: Repeat2,
      path: "/agent/followups",
    },
    {
      id: "earnings",
      label: "Qualifications",
      icon: Coins,
      path: "/agent/earnings",
    },
  ];
}

export default function Sidebar({ user, isOpen, onClose }) {
  const navItems = getSidebarItems(user?.role);

  const navClassName = ({ isActive }) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
      isActive
        ? "bg-primary-600 text-white shadow-lg"
        : `text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/70 hover:text-slate-900 dark:hover:text-white`
    }`;

  return (
    <>
      <aside className="hidden md:block w-72 shrink-0">
        <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 backdrop-blur p-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-theme">
          <p className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
            Navigation
          </p>
          <nav className="space-y-2">
            {navItems.map(({ id, label, icon: Icon, path }) => (
              <NavLink
                key={id}
                to={path}
                end={id === "overview"}
                className={navClassName}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-label="Close navigation"
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto scrollbar-theme">
            <p className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
              Navigation
            </p>
            <nav className="space-y-2">
              {navItems.map(({ id, label, icon: Icon, path }) => (
                <NavLink
                  key={id}
                  to={path}
                  end={id === "overview"}
                  className={navClassName}
                  onClick={onClose}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
