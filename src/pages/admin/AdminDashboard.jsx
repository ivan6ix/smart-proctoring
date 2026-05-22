import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ClipboardList,
  Monitor,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";
import AdminTopbarLayout from "../../layouts/AdminTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function AdminDashboard() {
  const [violations, setViolations] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [recentExams, setRecentExams] = useState([]);

  const fetchDashboardData = async () => {
    const { data: violationsData } = await supabase
      .from("violations")
      .select("*");

    const { data: professorsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "professor");

    const { data: examsData } = await supabase
      .from("exams")
      .select(`
        *,
        courses (
          course_name,
          section
        ),
        profiles:professor_id (
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    setViolations(violationsData || []);
    setProfessors(professorsData || []);
    setRecentExams(examsData || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, []);

  const tabSwitchCount = violations.filter(
    (v) => v.violation_type === "TAB_SWITCH"
  ).length;

  const loudAudioCount = violations.filter(
    (v) =>
      v.violation_type === "LOUD_AUDIO" ||
      v.violation_type === "POSSIBLE_CONVERSATION"
  ).length;

  const fullscreenExitCount = violations.filter(
    (v) => v.violation_type === "FULLSCREEN_EXIT"
  ).length;

  const mostActiveProfessors = professors.slice(0, 5);

  return (
    <AdminTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h2>

        <p className="text-sm sm:text-base text-gray-500">
          Manage professors, courses, deans, students, and system accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Professors</p>
          <h3 className="text-3xl font-bold mt-2">{professors.length}</h3>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Students</p>
          <h3 className="text-3xl font-bold mt-2">0</h3>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Courses</p>
          <h3 className="text-3xl font-bold mt-2">0</h3>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Active Exams</p>
          <h3 className="text-3xl font-bold mt-2">{recentExams.length}</h3>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Violations Today</p>
          <h3 className="text-3xl font-bold mt-2 text-red-600">
            {violations.length}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Dean Accounts</p>
          <h3 className="text-3xl font-bold mt-2">0</h3>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6 mb-6">
        <h3 className="text-xl font-bold mb-5">Quick Actions</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <Link to="/admin/professors" className="bg-blue-50 hover:bg-blue-100 rounded-3xl p-5 transition">
            <Users className="w-7 h-7 text-blue-700 mb-3" />
            <p className="font-bold">Create Professor</p>
          </Link>

          <Link to="/admin/create-dean" className="bg-purple-50 hover:bg-purple-100 rounded-3xl p-5 transition">
            <ShieldCheck className="w-7 h-7 text-purple-700 mb-3" />
            <p className="font-bold">Create Dean</p>
          </Link>

          <Link to="/admin/courses" className="bg-green-50 hover:bg-green-100 rounded-3xl p-5 transition">
            <BookOpen className="w-7 h-7 text-green-700 mb-3" />
            <p className="font-bold">Create Course</p>
          </Link>

          <Link to="/admin/accounts" className="bg-orange-50 hover:bg-orange-100 rounded-3xl p-5 transition">
            <UserCheck className="w-7 h-7 text-orange-700 mb-3" />
            <p className="font-bold">Manage Accounts</p>
          </Link>

          <Link to="/admin/reports" className="bg-red-50 hover:bg-red-100 rounded-3xl p-5 transition">
            <ClipboardList className="w-7 h-7 text-red-700 mb-3" />
            <p className="font-bold">View Reports</p>
          </Link>

          <Link to="/admin/monitoring" className="bg-gray-50 hover:bg-gray-100 rounded-3xl p-5 transition">
            <Monitor className="w-7 h-7 text-gray-700 mb-3" />
            <p className="font-bold">System Monitoring</p>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
          <h3 className="text-xl font-bold mb-5">Recent Account Activity</h3>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-3xl p-4 border border-gray-100">
              <p className="font-semibold">System activity will appear here.</p>
              <p className="text-sm text-gray-500 mt-1">Live data ready</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
          <h3 className="text-xl font-bold mb-5">System Health Status</h3>

          <div className="space-y-4">
            <div className="bg-green-50 rounded-3xl p-4 border border-green-100 flex items-center justify-between">
              <div>
                <p className="font-semibold">Database Status</p>
                <p className="text-sm text-green-700">ONLINE</p>
              </div>

              <Activity className="w-6 h-6 text-green-600" />
            </div>

            <div className="bg-blue-50 rounded-3xl p-4 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="font-semibold">Realtime Monitoring</p>
                <p className="text-sm text-blue-700">ACTIVE</p>
              </div>

              <Monitor className="w-6 h-6 text-blue-600" />
            </div>

            <div className="bg-green-50 rounded-3xl p-4 border border-green-100 flex items-center justify-between">
              <div>
                <p className="font-semibold">Supabase Storage</p>
                <p className="text-sm text-green-700">ONLINE</p>
              </div>

              <AlertTriangle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
          <h3 className="text-xl font-bold mb-5">Violation Analytics</h3>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-semibold">Tab Switch</p>
                <p className="font-bold text-red-600">{tabSwitchCount}</p>
              </div>

              <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: "80%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <p className="font-semibold">Loud Audio</p>
                <p className="font-bold text-orange-600">{loudAudioCount}</p>
              </div>

              <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: "55%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <p className="font-semibold">Fullscreen Exit</p>
                <p className="font-bold text-yellow-600">
                  {fullscreenExitCount}
                </p>
              </div>

              <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full rounded-full" style={{ width: "35%" }} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
          <h3 className="text-xl font-bold mb-5">Most Active Professors</h3>

          <div className="space-y-4">
            {mostActiveProfessors.length === 0 ? (
              <p className="text-gray-500">No professor data yet.</p>
            ) : (
              mostActiveProfessors.map((professor) => (
                <div key={professor.id} className="bg-gray-50 rounded-3xl p-4 border border-gray-100">
                  <p className="font-semibold">
                    {professor.full_name || "Unnamed Professor"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {professor.school_id || "No Employee Number"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
          <h3 className="text-xl font-bold mb-5">Recent Exams Created</h3>

          <div className="space-y-4">
            {recentExams.length === 0 ? (
              <p className="text-gray-500">No recent exams yet.</p>
            ) : (
              recentExams.map((exam) => (
                <div key={exam.id} className="bg-gray-50 rounded-3xl p-4 border border-gray-100">
                  <p className="font-semibold">{exam.title}</p>

                  <p className="text-sm text-gray-500">
                    {exam.courses?.course_name || "No Course"}{" "}
                    {exam.courses?.section ? `- ${exam.courses.section}` : ""}
                  </p>

                  <p className="text-sm text-blue-600 mt-1">
                    Created by {exam.profiles?.full_name || "Unknown Professor"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AdminTopbarLayout>
  );
}

export default AdminDashboard;