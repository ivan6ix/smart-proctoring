import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { supabase } from "../../lib/supabaseClient";
import { Link } from "react-router-dom";

function AvailableExamsPage() {
  const [exams, setExams] = useState([]);

  const fetchAvailableExams = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data: allowedData, error } = await supabase
      .from("exam_allowed_students")
      .select(`
        *,
        exams (
          *,
          courses (
            course_name,
            section
          )
        )
      `)
      .eq("student_id", userData.user.id)
      .eq("exams.status", "published")
      .eq("exams.approval_status", "accepted")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    const examData = (allowedData || [])
      .map((item) => item.exams)
      .filter(Boolean);

    const { data: attemptsData } = await supabase
      .from("exam_attempts")
      .select("exam_id")
      .eq("student_id", userData.user.id)
      .eq("status", "submitted");

    const submittedExamIds = attemptsData?.map((item) => item.exam_id) || [];

    const filteredExams = examData.filter((exam) => {
      const submittedCount = submittedExamIds.filter(
        (id) => id === exam.id
      ).length;

      return submittedCount < Number(exam.attempts || 1);
    });

    setExams(filteredExams);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAvailableExams();
  }, []);

  return (
    <DashboardLayout role="Student">
      <h2 className="text-2xl font-bold mb-6">Available Exams</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {exams.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500">No published exams available.</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-xl font-bold mb-2">{exam.title}</h3>

              <p className="text-gray-500 mb-1">
                {exam.courses?.course_name}
              </p>

              <p className="text-gray-500 mb-1">{exam.courses?.section}</p>

              <p className="text-gray-500 mb-1">{exam.exam_type}</p>

              <p className="text-gray-500 mb-1">
                Attempts Allowed: {exam.attempts}
              </p>

              <p className="text-gray-500 mb-4">
                Duration: {exam.duration} mins
              </p>

              <Link
                to={`/student/exam/${exam.id}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
              >
                Take Exam
              </Link>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

export default AvailableExamsPage;