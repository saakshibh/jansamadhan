import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewComplaint from "./pages/NewComplaint";
import MyComplaints from "./pages/MyComplaints";
import ComplaintDetail from "./pages/ComplaintDetail";
import OfficerDashboard from "./pages/OfficerDashboard";
import OfficerQueue from "./pages/OfficerQueue";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminDepartments from "./pages/AdminDepartments";
import AdminAudit from "./pages/AdminAudit";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { STAFF_ROLES, ADMIN_ROLES } from "./utils/constants";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          element={
            <ProtectedRoute roles={["citizen"]}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/complaints/new" element={<NewComplaint />} />
          <Route path="/complaints" element={<MyComplaints />} />
          <Route path="/complaints/:id" element={<ComplaintDetail />} />
        </Route>

        <Route
          element={
            <ProtectedRoute roles={STAFF_ROLES}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/officer/complaints" element={<OfficerQueue />} />
          <Route path="/officer/complaints/:id" element={<ComplaintDetail />} />
        </Route>

        <Route
          element={
            <ProtectedRoute roles={ADMIN_ROLES}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/departments" element={<AdminDepartments />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
        </Route>

        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
            <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}