// =============================================================
// src/App.jsx — PPST E-Portal Root Application
// =============================================================
// URL Structure:
//   PUBLIC
//     /login          → Student login  (rejects staff)
//     /login/staff    → Staff login    (rejects students)
//     /               → Smart redirect based on role
//
//   STUDENT  /student/*
//   ADMIN    /admin/*
//   LECTURER /lecturer/*
//   PENGARAH /pengarah/*
// =============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute             from "./components/ProtectedRoute";

// Login pages
import LoginStudent from "./pages/LoginStudent";
import LoginStaff   from "./pages/LoginStaff";

// Student module
import StudentLayout    from "./modules/student/StudentLayout";
import StudentDashboard from "./modules/student/StudentDashboard";
import ApplyForm        from "./modules/student/ApplyForm";
import { ApplicationList, ApplicationDetail } from "./modules/student/ApplicationTracker";

// Admin module
import AdminLayout          from "./modules/admin/AdminLayout";
import AdminDashboard       from "./modules/admin/AdminDashboard";
import AdminApplicationList from "./modules/admin/AdminApplicationList";
import AdminReviewPage      from "./modules/admin/AdminReviewPage";
import PdfTools             from "./modules/admin/PdfTools";

// Lecturer module
import LecturerLayout    from "./modules/lecturer/LecturerLayout";
import LecturerDashboard from "./modules/lecturer/LecturerDashboard";
import ClassRoster       from "./modules/lecturer/ClassRoster";
import AttendanceRecords from "./modules/lecturer/AttendanceRecords";

// Pengarah module
import PengarahLayout       from "./modules/pengarah/PengarahLayout";
import PengarahDashboard    from "./modules/pengarah/PengarahDashboard";
import PengarahApprovalList from "./modules/pengarah/PengarahApprovalList";
import PengarahReviewPage   from "./modules/pengarah/PengarahReviewPage";

import "./App.css";

// =============================================================
// Smart Root Redirect
// =============================================================
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;
  const map = {
    student:  "/student",
    admin:    "/admin",
    lecturer: "/lecturer",
    pengarah: "/pengarah",
  };
  return <Navigate to={map[user.role] || "/login"} replace />;
};

// =============================================================
// 404
// =============================================================
const NotFound = () => (
  <div className="not-found">
    <div className="not-found-content">
      <span className="not-found-code">404</span>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or you don't have access.</p>
      <a href="/login" className="not-found-link">← Return to Login</a>
    </div>
  </div>
);

// =============================================================
// Routes
// =============================================================
const AppRoutes = () => (
  <Routes>
    {/* ── Public ── */}
    <Route path="/login"        element={<LoginStudent />} />
    <Route path="/login/staff"  element={<LoginStaff />} />
    <Route path="/"             element={<RootRedirect />} />

    {/* ── Student ── */}
    <Route path="/student"
      element={<ProtectedRoute roles={["student"]}><StudentLayout /></ProtectedRoute>}>
      <Route index                  element={<StudentDashboard />} />
      <Route path="apply"           element={<ApplyForm />} />
      <Route path="apply/:form_type" element={<ApplyForm />} />
      <Route path="track"           element={<ApplicationList />} />
      <Route path="track/:id"       element={<ApplicationDetail />} />
    </Route>

    {/* ── Admin ── */}
    <Route path="/admin"
      element={<ProtectedRoute roles={["admin"]}><AdminLayout /></ProtectedRoute>}>
      <Route index                  element={<AdminDashboard />} />
      <Route path="applications"    element={<AdminApplicationList />} />
      <Route path="applications/:id" element={<AdminReviewPage />} />
      <Route path="pdf-tools"       element={<PdfTools />} />
    </Route>

    {/* ── Lecturer ── */}
    <Route path="/lecturer"
      element={<ProtectedRoute roles={["lecturer"]}><LecturerLayout /></ProtectedRoute>}>
      <Route index           element={<LecturerDashboard />} />
      <Route path="roster"   element={<ClassRoster />} />
      <Route path="attendance" element={<AttendanceRecords />} />
    </Route>

    {/* ── Pengarah ── */}
    <Route path="/pengarah"
      element={<ProtectedRoute roles={["pengarah"]}><PengarahLayout /></ProtectedRoute>}>
      <Route index                  element={<PengarahDashboard />} />
      <Route path="approvals"       element={<PengarahApprovalList />} />
      <Route path="approvals/:id"   element={<PengarahReviewPage />} />
    </Route>

    {/* ── 404 ── */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
