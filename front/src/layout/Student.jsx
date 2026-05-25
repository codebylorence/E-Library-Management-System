import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const Student = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Student;
