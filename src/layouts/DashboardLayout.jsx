import { FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";


const menuItems = {
  Admin: [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Professors", path: "/admin/professors" },
    { label: "Courses", path: "/admin/courses" },
    { label: "Create Dean", path: "/admin/create-dean" },
    { label: "Manage Accounts", path: "/admin/accounts" },
  ],

  Professor: [
    { label: "Dashboard", path: "/professor/dashboard" },
    { label: "My Courses", path: "/professor/courses" },
    { label: "Exams", path: "/professor/exams" },
    { label: "Monitoring Center", path: "/professor/monitoring" },
    { label: "Scores", path: "/professor/scores" },
  ],

  Student: [
    { label: "Dashboard", path: "/student/dashboard" },
    { label: "Available Exams", path: "/student/exams" },
    { label: "Grades", path: "/student/grades" },
  ],

  Dean: [
    { label: "Dashboard", path: "/dean/dashboard" },
    { label: "Exam Approvals", path: "/dean/approvals" },
    { label: "Reports", path: "/dean/reports" },
    { label: "Violations", path: "/dean/violations" },
  ],
};

function DashboardLayout({ role, children }) {
  const items = menuItems[role] || [];
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-blue-900 text-white min-h-screen p-5">
        <h1 className="text-xl font-bold mb-8">Smart Proctoring</h1>

        <nav className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="block hover:bg-blue-800 p-3 rounded-lg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{role} Dashboard</h2>
            <p className="text-sm text-gray-500">
              Smart Proctoring Thru Audio and Visual Monitoring
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 text-gray-700"
            >
              <FaUserCircle className="text-3xl" />
              <span className="font-medium">Profile</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border z-50">
                <Link to="/profile/settings" className="block px-4 py-3 hover:bg-gray-100">
                  Profile Settings
                </Link>

                <Link to="/profile/notifications" className="block px-4 py-3 hover:bg-gray-100">
                  Notification Settings
                </Link>

                <Link to="/profile/password" className="block px-4 py-3 hover:bg-gray-100">
                  Privacy / Password
                </Link>

                <button
                onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600"
                >
                Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;