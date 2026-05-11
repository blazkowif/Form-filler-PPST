// src/modules/lecturer/LecturerLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import "./LecturerLayout.css";

const LecturerLayout = () => (
  <div className="lecturer-layout">
    <Sidebar />
    <main className="lecturer-main">
      <Outlet />
    </main>
  </div>
);

export default LecturerLayout;
