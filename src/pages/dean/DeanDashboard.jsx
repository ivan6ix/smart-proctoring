import { useEffect, useState } from "react";
import {
  CheckCircle,
  FileText,
  MessageCircle,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import DeanTopbarLayout from "../../layouts/DeanTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function DeanDashboard() {
  const [pendingExams, setPendingExams] = useState([]);
  const [exams, setExams] = useState([]);
  const [violations, setViolations] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [previewQuestions, setPreviewQuestions] = useState([]);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState("");
  const [messageText, setMessageText] = useState("");
  const [professorSearch, setProfessorSearch] = useState("");

  const fetchExamCounts = async () => {
    const { data, error } = await supabase
      .from("exams")
      .select("id, approval_status");

    if (!error) setExams(data || []);
  };

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
    const { data, error } = await supabase.from("violations").select("*");
    if (!error) setViolations(data || []);
  };

  const fetchProfessors = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "professor")
      .eq("is_active", true);

    if (!error) setProfessors(data || []);
  };

  const updateApprovalStatus = async (examId, status) => {
    const confirmAction = window.confirm(
      status === "approved" ? "Approve this exam?" : "Reject this exam?"
    );

    if (!confirmAction) return;

    const { error } = await supabase
      .from("exams")
      .update({ approval_status: status })
      .eq("id", examId);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      status === "approved"
        ? "Exam approved successfully."
        : "Exam rejected successfully."
    );

    fetchPendingExams();
    fetchExamCounts();
  };

  const openExamPreview = async (exam) => {
    setSelectedExam(exam);
    setShowPreviewModal(true);

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", exam.id);

    if (!error) setPreviewQuestions(data || []);
  };

  const handleSendMessage = async () => {
    if (!selectedProfessor || !messageText) {
      alert("Please complete all fields.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("messages").insert({
      sender_id: userData.user.id,
      receiver_id: selectedProfessor,
      message: messageText,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Message sent successfully.");

    setSelectedProfessor("");
    setMessageText("");
    setProfessorSearch("");
    setShowMessageModal(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingExams();
    fetchExamCounts();
    fetchViolations();
    fetchProfessors();
  }, []);

  const pendingCount = exams.filter(
    (exam) => exam.approval_status === "pending" || !exam.approval_status
  ).length;

  const approvedCount = exams.filter(
    (exam) => exam.approval_status === "approved"
  ).length;

  const rejectedCount = exams.filter(
    (exam) => exam.approval_status === "rejected"
  ).length;

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
        <Card title="Pending Exam Approvals" value={pendingCount} />
        <Card title="Approved Exams" value={approvedCount} />
        <Card title="Rejected Exams" value={rejectedCount} />
        <Card title="Total Violations" value={violations.length} danger />
      </div>

      <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>

        <div className="flex flex-wrap justify-center gap-4">
          <Quick to="/dean/approvals" icon={<CheckCircle />} label="Review Exams" />

          <Quick to="/dean/reports" icon={<FileText />} label="Open Reports" />

          <button
            onClick={() => setShowMessageModal(true)}
            className="w-full sm:w-[280px] bg-gray-50 hover:bg-blue-50 rounded-3xl p-5 transition text-left"
          >
            <div className="w-7 h-7 text-blue-700 mb-3">
              <MessageCircle />
            </div>

            <p className="font-bold">Message Professors</p>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Recent Exam Requests</h3>

            <Link
              to="/dean/approvals"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl text-sm font-semibold"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingExams.length === 0 ? (
              <p className="text-gray-500">No pending exam requests.</p>
            ) : (
              pendingExams.map((exam) => (
                <RequestCard
                  key={exam.id}
                  exam={exam}
                  onApprove={() => updateApprovalStatus(exam.id, "approved")}
                  onReject={() => updateApprovalStatus(exam.id, "rejected")}
                  onPreview={() => openExamPreview(exam)}
                />
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

      {showMessageModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-2xl font-bold mb-5">Message Professors</h3>

            <input
              value={professorSearch}
              onChange={(e) => setProfessorSearch(e.target.value)}
              placeholder="Search professor..."
              className="w-full border rounded-2xl px-4 py-3 mb-4"
            />

            <select
              value={selectedProfessor}
              onChange={(e) => setSelectedProfessor(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 mb-4"
            >
              <option value="">Select Professor</option>

              {professors
                .filter((professor) =>
                  professor.full_name
                    ?.toLowerCase()
                    .includes(professorSearch.toLowerCase())
                )
                .map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.full_name} • {professor.school_id}
                  </option>
                ))}
            </select>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={6}
              placeholder="Type your message..."
              className="w-full border rounded-2xl px-4 py-3 mb-5 resize-none"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSendMessage}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold"
              >
                Send Message
              </button>

              <button
                onClick={() => setShowMessageModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && selectedExam && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="float-right"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900">
              {selectedExam.title}
            </h3>

            <p className="text-gray-500 mb-6">
              {selectedExam.courses?.course_name || "No Course"} •{" "}
              {selectedExam.courses?.section || "No Section"}
            </p>

            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
              <h4 className="text-xl font-bold mb-4">Questions</h4>

              {previewQuestions.length === 0 ? (
                <p className="text-gray-500">No questions found.</p>
              ) : (
                <div className="space-y-4">
                  {previewQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="bg-white rounded-2xl p-4 border border-gray-100"
                    >
                      <p className="font-bold text-gray-900">
                        {index + 1}.{" "}
                        {question.question ||
                          question.question_text ||
                          "Untitled question"}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        Type: {question.question_type || "N/A"} • Points:{" "}
                        {question.points || 0}
                      </p>

                      {question.correct_answer && (
                        <p className="text-sm text-green-700 font-semibold mt-3">
                          Correct Answer: {question.correct_answer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
      className="w-full sm:w-[280px] bg-gray-50 hover:bg-blue-50 rounded-3xl p-5 transition"
    >
      <div className="w-7 h-7 text-blue-700 mb-3">{icon}</div>
      <p className="font-bold">{label}</p>
    </Link>
  );
}

function RequestCard({ exam, onApprove, onReject, onPreview }) {
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
        <button
          onClick={onApprove}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-sm font-semibold"
        >
          Approve
        </button>

        <button
          onClick={onReject}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-semibold"
        >
          Reject
        </button>

        <button
          onClick={onPreview}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-sm font-semibold"
        >
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