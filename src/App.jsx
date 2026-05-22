import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LeadsProvider } from "./context/LeadsContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { getRoleHomeRoute, ROLES } from "./utils/roleUtils";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./pages/DashboardLayout";
import OverviewPage from "./pages/OverviewPage";
import LeadsPage from "./pages/LeadsPage";
import ManageCallerLeads from "./pages/ManageCallerLeads";
import CallLogsPage from "./pages/CallLogsPage";
import CampaignsPage from "./pages/CampaignsPage";
import AgentAvailabilityPage from "./pages/AgentAvailabilityPage";
import AttendanceHistoryPage from "./pages/AttendanceHistoryPage";
import ScraperPage from "./pages/ScraperPage";
import AutoDialerPage from "./pages/AutoDialerPage";
import DirectDialerPage from "./pages/DirectDialerPage";
import PowerDialerPage from "./pages/PowerDialerPage";
import AgentManagementPage from "./pages/AgentManagementPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleHomeRedirect from "./routes/RoleHomeRedirect";
import MyTasksPage from "./pages/MyTasksPage";
import EarningsHistoryPage from "./pages/EarningsHistoryPage";
import ManageClientOffers from "./pages/ManageClientOffers";
import MyLeadsPage from "./pages/MyLeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import NotificationsPage from "./pages/NotificationsPage";
import ClientProfilePage from "./pages/ClientProfilePage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import ClientMarketplacePage from "./pages/ClientMarketplacePage";
import ClientManagementPage from "./pages/ClientManagementPage";
import React from "react";
import MobileBlockWrapper from "./components/MobileBlockWrapper";
import CelebrationListener from "./components/CelebrationListener";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <AuthProvider>
      <MobileBlockWrapper>
        <NotificationProvider>
          <CelebrationListener />
          <Router>
            <ScrollToTop />
            <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD]}>
                  <LeadsProvider campaignId="">
                    <DashboardLayout />
                  </LeadsProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="tasks" element={<MyTasksPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="scraper" element={<ScraperPage />} />
              <Route path="caller-leads" element={<ManageCallerLeads />} />
              {/* <Route path="closer-leads" element={<ManageCallerLeads />} /> */}
              <Route path="call-logs" element={<CallLogsPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="agents" element={<AgentAvailabilityPage />} />
              <Route path="user-management" element={<AgentManagementPage />} />
              <Route path="client-management" element={<ClientManagementPage />} />
              <Route path="attendance" element={<AttendanceHistoryPage />} />
              <Route path="earnings" element={<EarningsHistoryPage />} />
              <Route
                path="auto-dialer"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                    <AutoDialerPage />
                  </ProtectedRoute>
                }
              />
              <Route path="direct-dialer" element={<DirectDialerPage />} />
              <Route path="client-leads" element={<ManageClientOffers />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            <Route
              path="/client"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ClientDashboardPage />} />
              <Route path="leads" element={<MyLeadsPage />} />
              <Route path="leads/:offerId" element={<LeadDetailPage />} />
              {/* <Route path="marketplace" element={<ClientMarketplacePage />} /> */}
              <Route path="profile" element={<ClientProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            <Route
              path="/agent"
              element={
                <ProtectedRoute allowedRoles={[ROLES.CALLER_AGENT, ROLES.TEAM_LEAD]}>
                  <LeadsProvider campaignId="">
                    <DashboardLayout />
                  </LeadsProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="tasks" element={<MyTasksPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="followups" element={<ManageCallerLeads />} />
              <Route path="power-dialer" element={<PowerDialerPage />} />
              <Route
                path="auto-dialer"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CALLER_AGENT]}>
                    <AutoDialerPage />
                  </ProtectedRoute>
                }
              />
              <Route path="direct-dialer" element={<DirectDialerPage />} />
              <Route path="earnings" element={<EarningsHistoryPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              {/* <Route path="call-logs" element={<CallLogsPage />} /> */}
            </Route>

            <Route
              path="/scrapper"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SCRAPPER]}>
                  <LeadsProvider campaignId="">
                    <DashboardLayout />
                  </LeadsProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<ScraperPage />} />
              <Route path="tasks" element={<MyTasksPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              {/* <Route path="scraper" element={<ScraperPage />} /> */}
            </Route>

            <Route path="/dashboard" element={<RoleHomeRedirect />} />

            <Route path="/" element={<RoleHomeRedirect />} />

            <Route path="*" element={<RoleHomeRedirect />} />
          </Routes>
        </Router>
        </NotificationProvider>
      </MobileBlockWrapper>
      </AuthProvider>
  );
}

export default App;
