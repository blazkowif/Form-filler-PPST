// src/modules/pengarah/PengarahLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import "./PengarahLayout.css";

const PengarahLayout = () => (
  <div className="pengarah-layout">
    <Sidebar />
    <main className="pengarah-main">
      <Outlet />
    </main>
  </div>
);

export default PengarahLayout;
