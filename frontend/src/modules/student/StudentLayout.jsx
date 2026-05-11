// =============================================================
// src/modules/student/StudentLayout.jsx
// Wraps all student pages with the persistent Sidebar + main area
// =============================================================
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import "./StudentLayout.css";

const StudentLayout = () => (
  <div className="student-layout">
    <Sidebar />
    <main className="student-main">
      <Outlet />
    </main>
  </div>
);

export default StudentLayout;
