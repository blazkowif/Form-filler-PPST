// =============================================================
// src/modules/admin/AdminLayout.jsx
// Wraps all admin pages with Sidebar + main area
// =============================================================
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import "./AdminLayout.css";

const AdminLayout = () => (
  <div className="admin-layout">
    <Sidebar />
    <main className="admin-main">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
