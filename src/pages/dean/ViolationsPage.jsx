import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  FileText,
  MessageCircle,
  Monitor,
} from "lucide-react";
import { Link } from "react-router-dom";
import DeanTopbarLayout from "../../layouts/DeanTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function DeanDashboard() {
  const [pendingExams, setPendingExams] = useState([]);
  const [violations, setViolations] = useState([]);

  const fetchPendingExams = async () => {
    const { data, error } = await supabase
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
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });

    if (!error) setPendingExams(data || []);
  };

  const fetchViolations = async () => {
    const { data, error } = await supabase
      .from("violations")
      .select("*");

    if (!error) setViolations(data || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingExams();
    fetchViolations();
  }, []);

  const totalViolations = violations.length || 1;

  const tabSwitchPercent = Math.round(
    (violations.filter((v) => v.violation_type === "TAB_SWITCH").length /
      totalViolations) *
      100
  );

  const lookingAwayPercent = Math.round(
    (violations.filter((v) => v.violation_type === "LOOKING_AWAY").length /
      totalViolations) *
      100
  );

  const loudAudioPercent = Math.round(
    (violations.filter(
      (v) =>
        v.violation_type === "LOUD_AUDIO" ||
        v.violation_type === "POSSIBLE_CONVERSATION"
    ).length /
      totalViolations) *
      100
  );

  return (
    <DeanTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Dean Dashboard
        </h2>

        <p className="text-sm sm:text-base text-gray-500">
          Review exam approvals, violations, reports, and department activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <Card title="Pending Exam Approvals" value={pendingExams.length} />
        <Card title="Approved Exams" value="0" />
        <Card title="Rejected Exams" value="0" />
        <Card title="Total Violations" value={violations.length} danger />
      </div>

      <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <Quick to="/dean/approvals" icon={<CheckCircle />} label="Review Exams" />
          <Quick to="/dean/reports" icon={<FileText />} label="Open Reports" />
          <Quick to="/dean/violations" icon={<AlertTriangle />} label="View Violations" />
          <Quick to="/dean/reports" icon={<ClipboardList />} label="Generate PDF Reports" />
          <Quick to="/dean/monitoring" icon={<Monitor />} label="Monitoring Center" />
          <Quick to="/dean/messages" icon={<MessageCircle />} label="Message Professors" />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Recent Exam Requests</h3>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl text-sm font-semibold">
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingExams.length === 0 ? (
              <p className="text-gray-500">No pending exam requests.</p>
            ) : (
              pendingExams.map((exam) => (
                <RequestCard key={exam.id} exam={exam} />
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow border border-gray-100 p-5">
          <h3 className="text-xl font-bold mb-4">
            Department Violation Analytics
          </h3>

          <Progress label="Tab Switching" value={tabSwitchPercent} />
          <Progress label="Looking Away" value={lookingAwayPercent} />
          <Progress label="Loud Audio / Conversation" value={loudAudioPercent} />
        </section>
      </div>
    </DeanTopbarLayout>
  );
}

function Card({ title, value, danger }) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl shadow border border-gray-100">
      <p className="text-gray-500">{title}</p>
      <h3 className={`text-3xl font-bold mt-2 ${danger ? "text-red-600" : ""}`}>
        {value}
      </h3>
    </div>
  );
}

function Quick({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="bg-gray-50 hover:bg-blue-50 rounded-3xl p-5 transition"
    >
      <div className="w-7 h-7 text-blue-700 mb-3">{icon}</div>
      <p className="font-bold">{label}</p>
    </Link>
  );
}

function RequestCard({ exam }) {
  return (
    <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
      <p className="font-bold">{exam.title}</p>

      <p className="text-sm text-gray-500">
        {exam.courses?.course_name || "No Course"} •{" "}
        {exam.courses?.section || "No Section"}
      </p>

      <p className="text-sm text-blue-600 mt-1">
        Submitted by {exam.profiles?.full_name || "Unknown Professor"}
      </p>

      <p className="text-sm text-yellow-600 font-semibold mt-2">
        Waiting for Approval
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        <button className="px-4 py-2 bg-green-600 text-white rounded-2xl text-sm font-semibold">
          Approve
        </button>

        <button className="px-4 py-2 bg-red-600 text-white rounded-2xl text-sm font-semibold">
          Reject
        </button>

        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold">
          Preview
        </button>
      </div>
    </div>
  );
}

function Progress({ label, value }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2">
        <p className="font-semibold">{label}</p>
        <p className="font-bold text-blue-700">{value}%</p>
      </div>

      <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
        <div
          className="bg-blue-600 h-full rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default DeanDashboard;