import { useEffect, useState } from "react";
import DeanTopbarLayout from "../../layouts/DeanTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function ExamApprovalsPage() {
  const [exams, setExams] = useState([]);

  const fetchExams = async () => {
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
      .order("created_at", { ascending: false });

    if (!error) {
      setExams(data || []);
    }
  };

  const updateApprovalStatus = async (examId, status) => {
    const confirmAction = window.confirm(
      `Are you sure you want to ${status} this exam?`
    );

    if (!confirmAction) return;

    const exam = exams.find((item) => item.id === examId);

    const { error } = await supabase
      .from("exams")
      .update({
        approval_status: status,
      })
      .eq("id", examId);

    if (error) {
      alert(error.message);
      return;
    }
    console.log("Exam:", exam);
    console.log("Professor ID:", exam?.professor_id);
    console.log("Status:", status);
    if (exam?.professor_id) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: exam.professor_id,

          title:
            status === "approved"
              ? "Exam Approved"
              : "Exam Rejected",

          message:
            status === "approved"
              ? `Your exam "${exam.title}" was approved by the dean.`
              : `Your exam "${exam.title}" was rejected by the dean.`,

          type:
            status === "approved"
              ? "exam_approval"
              : "exam_rejection",
        });

      if (notifError) {
        console.log(notifError);
      }
    }

    alert(`Exam ${status} successfully.`);
    fetchExams();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExams();
  }, []);

  const pendingExams = exams.filter(
    (exam) => exam.approval_status === "pending" || !exam.approval_status
  );

  const approvedExams = exams.filter(
    (exam) => exam.approval_status === "approved"
  );

  const rejectedExams = exams.filter(
    (exam) => exam.approval_status === "rejected"
  );

  return (
    <DeanTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Exam Approvals
        </h2>

        <p className="text-gray-500">
          Review, approve, or reject exam requests submitted by professors.
        </p>
      </div>

      <ExamSection
        title="Pending Exams"
        exams={pendingExams}
        empty="No pending exam requests."
        onApprove={(id) => updateApprovalStatus(id, "approved")}
        onReject={(id) => updateApprovalStatus(id, "rejected")}
      />

      <ExamSection
        title="Approved Exams"
        exams={approvedExams}
        empty="No approved exams yet."
      />

      <ExamSection
        title="Rejected Exams"
        exams={rejectedExams}
        empty="No rejected exams yet."
      />
    </DeanTopbarLayout>
  );
}

function ExamSection({ title, exams, empty, onApprove, onReject }) {
  return (
    <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 mb-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>

      {exams.length === 0 ? (
        <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
          {empty}
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-gray-50 rounded-3xl p-5 border border-gray-100"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h4 className="font-bold text-lg text-gray-900">
                    {exam.title}
                  </h4>

                  <p className="text-sm text-gray-500">
                    {exam.courses?.course_name || "No Course"} -{" "}
                    {exam.courses?.section || "No Section"}
                  </p>

                  <p className="text-sm text-blue-600 mt-1">
                    Submitted by{" "}
                    {exam.profiles?.full_name || "Unknown Professor"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                      exam.approval_status === "approved"
                        ? "bg-green-100 text-green-700"
                        : exam.approval_status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {exam.approval_status || "pending"}
                  </span>

                  {onApprove && (
                    <button
                      onClick={() => onApprove(exam.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-2xl text-sm font-semibold"
                    >
                      Approve
                    </button>
                  )}

                  {onReject && (
                    <button
                      onClick={() => onReject(exam.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-2xl text-sm font-semibold"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ExamApprovalsPage;