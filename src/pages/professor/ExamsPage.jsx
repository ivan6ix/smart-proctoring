import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfessorTopbarLayout from "../../layouts/ProfessorTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [shareMode, setShareMode] = useState("course");

  const fetchExams = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("exams")
      .select(`
        *,
        courses (
          course_name,
          section
        )
      `)
      .eq("professor_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!error) setExams(data || []);
  };

  const fetchCourses = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("professor_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!error) setCourses(data || []);
  };

  const fetchStudents = async () => {
    if (!selectedCourseId) {
      setStudents([]);
      return;
    }

    const { data, error } = await supabase
      .from("course_students")
      .select(`
        *,
        profiles:student_id (
          id,
          full_name,
          school_id
        )
      `)
      .eq("course_id", selectedCourseId);

    if (error) {
      alert(error.message);
      return;
    }

    setStudents(data || []);
  };

  const toggleExamStatus = async (exam) => {
    if (exam.approval_status !== "approved") {
      alert("This exam must be approved by the Dean before publishing.");
      return;
    }

    const newStatus =
      exam.status === "published" ? "unpublished" : "published";

    const { error } = await supabase
      .from("exams")
      .update({ status: newStatus })
      .eq("id", exam.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchExams();
  };

  const openShareModal = (exam) => {
    setSelectedExam(exam);
    setSelectedCourseId("");
    setSelectedStudentId("");
    setShareMode("course");
    setStudents([]);
    setShowShareModal(true);
  };

  const handleShareToCourse = async () => {
    if (!selectedExam || !selectedCourseId) {
      alert("Please select a course.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { data: newExam, error: examError } = await supabase
      .from("exams")
      .insert({
        course_id: selectedCourseId,
        professor_id: userData.user.id,
        title: selectedExam.title,
        exam_type: selectedExam.exam_type,
        period: selectedExam.period,
        semester: selectedExam.semester,
        instructions: selectedExam.instructions,
        duration: selectedExam.duration,
        attempts: selectedExam.attempts,
        status: "draft",
        approval_status: "pending",
        randomize_questions: selectedExam.randomize_questions,
        randomize_choices: selectedExam.randomize_choices,
        disable_copy_paste: selectedExam.disable_copy_paste,
        require_fullscreen: selectedExam.require_fullscreen,
      })
      .select()
      .single();

    if (examError) {
      alert(examError.message);
      return;
    }

    const { data: questionsData, error: questionsFetchError } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", selectedExam.id);

    if (questionsFetchError) {
      alert(questionsFetchError.message);
      return;
    }

    if (questionsData && questionsData.length > 0) {
      const copiedQuestions = questionsData.map((question) => ({
        exam_id: newExam.id,
        question: question.question,
        question_type: question.question_type,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_answer: question.correct_answer,
        points: question.points,
      }));

      const { error: insertQuestionsError } = await supabase
        .from("questions")
        .insert(copiedQuestions);

      if (insertQuestionsError) {
        alert(insertQuestionsError.message);
        return;
      }
    }

    alert("Exam shared successfully.");
    setShowShareModal(false);
    setSelectedExam(null);
    setSelectedCourseId("");
    setSelectedStudentId("");
    setStudents([]);
    fetchExams();
  };

  const handleShareToSpecificStudent = async () => {
    if (!selectedExam || !selectedStudentId) {
      alert("Please select a student.");
      return;
    }

    const { error } = await supabase.from("exam_allowed_students").insert({
      exam_id: selectedExam.id,
      student_id: selectedStudentId,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const { error: publishError } = await supabase
      .from("exams")
      .update({
        status: "published",
      })
      .eq("id", selectedExam.id);

    if (publishError) {
      alert(publishError.message);
      return;
    }

    alert("Exam shared to selected student successfully.");

    setShowShareModal(false);
    setSelectedStudentId("");
    setSelectedCourseId("");
    setSelectedExam(null);
    setStudents([]);
    fetchExams();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExams();
    fetchCourses();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  return (
    <ProfessorTopbarLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Exams
          </h2>
          <p className="text-sm sm:text-base text-gray-500">
            Create, publish, unpublish, share, and manage your exams.
          </p>
        </div>

        <Link
          to="/professor/exams/create"
          className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold shadow"
        >
          Create Exam
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {exams.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan="7">
                    No exams created yet.
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="border-b">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {exam.title}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {exam.courses?.course_name} - {exam.courses?.section}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {exam.exam_type}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {exam.period}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {exam.duration} mins
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className="px-4 py-2 rounded-2xl text-sm font-semibold bg-blue-100 text-blue-700">
                          Dean: {exam.approval_status || "pending"}
                        </span>

                        <span
                          className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                            exam.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {exam.status}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleExamStatus(exam)}
                          disabled={exam.approval_status !== "approved"}
                          className={`px-3 py-2 rounded-xl text-xs text-white font-semibold ${
                            exam.approval_status !== "approved"
                              ? "bg-gray-400 cursor-not-allowed"
                              : exam.status === "published"
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {exam.approval_status !== "approved"
                            ? "Waiting for Dean"
                            : exam.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>

                        <button
                          onClick={() => openShareModal(exam)}
                          className="px-3 py-2 rounded-xl text-xs text-white font-semibold bg-blue-600 hover:bg-blue-700"
                        >
                          Share
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden p-4 space-y-4">
          {exams.length === 0 ? (
            <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
              No exams created yet.
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-gray-50 rounded-3xl p-5 border border-gray-100"
              >
                <h3 className="font-bold text-lg text-gray-900">
                  {exam.title}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {exam.courses?.course_name} - {exam.courses?.section}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-4 py-2 rounded-2xl text-sm font-semibold bg-blue-100 text-blue-700">
                    Dean: {exam.approval_status || "pending"}
                  </span>

                  <span
                    className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                      exam.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {exam.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => toggleExamStatus(exam)}
                    disabled={exam.approval_status !== "approved"}
                    className={`px-3 py-2 rounded-xl text-xs text-white font-semibold ${
                      exam.approval_status !== "approved"
                        ? "bg-gray-400 cursor-not-allowed"
                        : exam.status === "published"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {exam.approval_status !== "approved"
                      ? "Waiting for Dean"
                      : exam.status === "published"
                      ? "Unpublish"
                      : "Publish"}
                  </button>

                  <button
                    onClick={() => openShareModal(exam)}
                    className="px-3 py-2 rounded-xl text-xs text-white font-semibold bg-blue-600"
                  >
                    Share
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showShareModal && selectedExam && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl p-6">
            <h3 className="text-xl font-bold mb-2">Share Exam</h3>

            <p className="text-sm text-gray-500 mb-5">
              Select if you want to copy this exam to another course or allow a
              specific student to access this exam.
            </p>

            <div className="flex gap-2 mb-5">
              <button
                onClick={() => {
                  setShareMode("course");
                  setSelectedStudentId("");
                }}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                  shareMode === "course"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Share to Course
              </button>

              <button
                onClick={() => setShareMode("student")}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                  shareMode === "student"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Share to Specific Student
              </button>
            </div>

            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedStudentId("");
              }}
              className="w-full border rounded-2xl px-4 py-3 mb-4"
            >
              <option value="">Select Course / Section</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name} - {course.section}
                </option>
              ))}
            </select>

            {shareMode === "student" && (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3 mb-5"
              >
                <option value="">Select Student</option>

                {students.map((student) => (
                  <option
                    key={student.profiles?.id}
                    value={student.profiles?.id}
                  >
                    {student.profiles?.full_name} (
                    {student.profiles?.school_id})
                  </option>
                ))}
              </select>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={
                  shareMode === "course"
                    ? handleShareToCourse
                    : handleShareToSpecificStudent
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold"
              >
                Share Exam
              </button>

              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedStudentId("");
                  setSelectedCourseId("");
                  setSelectedExam(null);
                  setStudents([]);
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfessorTopbarLayout>
  );
}

export default ExamsPage;