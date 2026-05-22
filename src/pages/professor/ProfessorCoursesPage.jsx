import { useEffect, useState } from "react";
import ProfessorTopbarLayout from "../../layouts/ProfessorTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function ProfessorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseExams, setCourseExams] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("First Semester");
  const [showMembers, setShowMembers] = useState(false);
  const [showCompletedExams, setShowCompletedExams] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examScores, setExamScores] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");

  const fetchCourses = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("professor_id", userData.user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (!error) {
      setCourses(data || []);
    }
  };

  const openCourse = async (course) => {
    setSelectedCourse(course);
    setSelectedPeriod("First Semester");
    setSelectedExam(null);
    setExamScores([]);
    setShowMembers(false);
    setShowCompletedExams(false);
    setMemberSearch("");

    const { data: examsData } = await supabase
      .from("exams")
      .select("*")
      .eq("course_id", course.id)
      .order("created_at", { ascending: false });

    const { data: membersData } = await supabase
      .from("course_students")
      .select(`
        *,
        profiles:student_id (
          full_name,
          school_id,
          role
        )
      `)
      .eq("course_id", course.id);

    setCourseExams(examsData || []);

    const sortedMembers = (membersData || []).sort((a, b) =>
      (a.profiles?.full_name || "").localeCompare(
        b.profiles?.full_name || ""
      )
    );

    setMembers(sortedMembers);
  };

  const openExamScores = async (exam) => {
    setSelectedExam(exam);

    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        profiles:student_id (
          full_name,
          school_id
        )
      `)
      .eq("exam_id", exam.id)
      .eq("status", "submitted");

    if (!error) {
      const sortedScores = (data || []).sort((a, b) =>
        (a.profiles?.full_name || "").localeCompare(
          b.profiles?.full_name || ""
        )
      );

      setExamScores(sortedScores);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourses();
  }, []);

  const now = new Date();

  const activeExams = courseExams.filter((exam) => {
    const samePeriod = !exam.period || exam.period === selectedPeriod;
    const notCompleted = !exam.deadline || new Date(exam.deadline) > now;

    return samePeriod && notCompleted;
  });

  const completedExams = courseExams.filter((exam) => {
    const samePeriod = !exam.period || exam.period === selectedPeriod;
    const isCompleted = exam.deadline && new Date(exam.deadline) <= now;

    return samePeriod && isCompleted;
  });

  const filteredMembers = members.filter((member) => {
    const name = member.profiles?.full_name || "";
    const schoolId = member.profiles?.school_id || "";
    const search = memberSearch.toLowerCase();

    return (
      name.toLowerCase().includes(search) ||
      schoolId.toLowerCase().includes(search)
    );
  });

  return (
    <ProfessorTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          My Courses
        </h2>

        <p className="text-sm sm:text-base text-gray-500">
          View your assigned courses, members, exams, and student scores.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow p-4 sm:p-6 border border-gray-100">
        {courses.length === 0 ? (
          <div className="border border-dashed rounded-3xl p-10 text-center text-gray-500">
            No active assigned courses yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => openCourse(course)}
                className="text-left bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-300 rounded-3xl p-5 transition"
              >
                <h3 className="font-bold text-lg text-gray-900">
                  {course.course_name}
                </h3>

                <p className="text-gray-500 mt-1">
                  {course.course_code} - {course.section}
                </p>

                <p className="mt-4 inline-block bg-white rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm">
                  Code: {course.joining_code}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-[95vw] h-[90vh] overflow-y-auto p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedCourse.course_name}
                </h3>

                <p className="text-gray-500">
                  {selectedCourse.course_code} - {selectedCourse.section}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Joining Code:{" "}
                  <span className="font-semibold text-gray-800">
                    {selectedCourse.joining_code}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-2xl font-semibold"
                >
                  Members
                </button>

                <button
                  onClick={() => setShowCompletedExams(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-2xl font-semibold"
                >
                  Completed Exams
                </button>

                <button
                  onClick={() => setSelectedCourse(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-2xl font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Select Period
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedPeriod("First Semester");
                    setSelectedExam(null);
                    setExamScores([]);
                  }}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold ${
                    selectedPeriod === "First Semester"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  First Semester
                </button>

                <button
                  disabled
                  className="px-4 py-2 rounded-2xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  Second Semester
                </button>

                <button
                  disabled
                  className="px-4 py-2 rounded-2xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  Trimester
                </button>
              </div>
            </div>

            {showMembers && (
              <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h4 className="font-bold text-xl">Course Members</h4>
                    <p className="text-sm text-gray-500">
                      Showing students enrolled in First Semester only.
                    </p>
                  </div>

                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full md:w-80 border rounded-2xl px-4 py-3"
                    placeholder="Search student name or ID..."
                  />
                </div>

                {filteredMembers.length === 0 ? (
                  <p className="text-gray-500">No members found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4"
                      >
                        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {member.profiles?.full_name?.charAt(0) || "S"}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            {member.profiles?.full_name || "Unknown Student"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.profiles?.school_id || "No School ID"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                <h4 className="font-bold text-xl mb-4">Exams</h4>

                {activeExams.length === 0 ? (
                  <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
                    No active exams found for this period.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeExams.map((exam) => (
                      <button
                        key={exam.id}
                        onClick={() => openExamScores(exam)}
                        className={`w-full text-left rounded-2xl p-4 border transition ${
                          selectedExam?.id === exam.id
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white border-gray-100 hover:bg-blue-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-gray-900">
                              {exam.title}
                            </p>

                            <p className="text-sm text-gray-500">
                              {exam.exam_type} • {exam.status}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              Deadline:{" "}
                              {exam.deadline
                                ? new Date(exam.deadline).toLocaleString()
                                : "No deadline"}
                            </p>
                          </div>

                          <span className="text-gray-400">→</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                <h4 className="font-bold text-xl mb-4">
                  {selectedExam
                    ? `Scores - ${selectedExam.title}`
                    : "Student Scores"}
                </h4>

                {!selectedExam ? (
                  <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
                    Select an exam to view student scores.
                  </div>
                ) : examScores.length === 0 ? (
                  <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
                    No submitted scores yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {examScores.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {attempt.profiles?.full_name || "Unknown Student"}
                          </p>

                          <p className="text-sm text-gray-500">
                            {attempt.profiles?.school_id || "No School ID"}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            Submitted:{" "}
                            {attempt.submitted_at
                              ? new Date(attempt.submitted_at).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>

                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl font-bold">
                          {attempt.score ?? 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {showCompletedExams && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Completed Exams
                </h3>

                <p className="text-sm text-gray-500">
                  Exams with finished deadlines for {selectedCourse?.course_name}.
                </p>
              </div>

              <button
                onClick={() => setShowCompletedExams(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-2xl font-semibold"
              >
                Close
              </button>
            </div>

            {completedExams.length === 0 ? (
              <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
                No completed exams yet.
              </div>
            ) : (
              <div className="space-y-3">
                {completedExams.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => {
                      openExamScores(exam);
                      setShowCompletedExams(false);
                    }}
                    className="w-full text-left bg-gray-50 hover:bg-blue-50 rounded-2xl p-4 border border-gray-100 hover:border-blue-300 transition"
                  >
                    <p className="font-bold text-gray-900">{exam.title}</p>

                    <p className="text-sm text-gray-500">
                      {exam.exam_type} • {exam.status}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Deadline ended: {new Date(exam.deadline).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ProfessorTopbarLayout>
  );
}

export default ProfessorCoursesPage;