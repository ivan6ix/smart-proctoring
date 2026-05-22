import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import StudentTopbarLayout from "../../layouts/StudentTopbarLayout";

function StudentDashboard() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joiningCode, setJoiningCode] = useState("");
  const [courses, setCourses] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);

  const fetchMyCourses = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("course_students")
      .select("courses(*)")
      .eq("student_id", userData.user.id);

    if (!error) {
      const joinedCourses = data.map((item) => item.courses);

      setCourses(joinedCourses);

      fetchAvailableExams(joinedCourses);
    }
  };

  const fetchAvailableExams = async (joinedCourses) => {
    const { data: userData } = await supabase.auth.getUser();

    const courseIds = joinedCourses.map((course) => course.id);

    if (courseIds.length === 0) {
      setAvailableExams([]);
      return;
    }

    const { data: attempts } = await supabase
      .from("exam_attempts")
      .select("exam_id")
      .eq("student_id", userData.user.id)
      .eq("status", "submitted");

    const takenExamIds =
      attempts?.map((item) => item.exam_id) || [];

    let query = supabase
      .from("exams")
      .select(`
        *,
        courses (
          course_name,
          course_code,
          section
        )
      `)
      .in("course_id", courseIds)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (takenExamIds.length > 0) {
      query = query.not(
        "id",
        "in",
        `(${takenExamIds.join(",")})`
      );
    }

    const { data, error } = await query;

    if (!error) {
      setAvailableExams(data || []);
    }
  };

  const handleJoinCourse = async (e) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("joining_code", joiningCode)
      .single();

    if (courseError || !course) {
      alert("Invalid joining code.");
      return;
    }

    const { error } = await supabase
      .from("course_students")
      .insert({
        course_id: course.id,
        student_id: userData.user.id,
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Course joined successfully.");

    setJoiningCode("");
    setShowJoinModal(false);

    fetchMyCourses();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyCourses();
  }, []);

  return (
    <StudentTopbarLayout>
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Student Dashboard
            </h2>

            <p className="text-sm sm:text-base text-gray-500">
              View your courses and available exams.
            </p>
          </div>

          <button
            onClick={() => setShowJoinModal(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold shadow"
          >
            Join Course
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-white rounded-3xl shadow p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
              <h3 className="text-xl font-bold">
                My Courses
              </h3>

              <span className="text-sm text-gray-500">
                {courses.length} joined
              </span>
            </div>

            {courses.length === 0 ? (
              <div className="border border-dashed rounded-3xl p-8 sm:p-10 text-center text-gray-500">
                No joined courses yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <Link
                    to={`/student/course/${course.id}`}
                    key={course.id}
                    className="block bg-white rounded-3xl shadow border border-gray-100 p-4 sm:p-5 hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-base sm:text-lg text-gray-900 break-words">
                          {course.course_name}
                        </h4>

                        <p className="text-sm sm:text-base text-gray-500 mt-1 break-words">
                          {course.course_code} - {course.section}
                        </p>
                      </div>

                      <span className="shrink-0 bg-white rounded-2xl px-3 py-2 text-sm shadow-sm">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="bg-white rounded-3xl shadow p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
              <h3 className="text-xl font-bold">
                Available Exams
              </h3>

              <span className="text-sm text-gray-500">
                {availableExams.length}
              </span>
            </div>

            {availableExams.length === 0 ? (
              <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
                No available exams yet.
              </div>
            ) : (
              <div className="space-y-4">
                {availableExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="border border-gray-100 rounded-3xl p-4 bg-gray-50"
                  >
                    <h4 className="font-bold text-gray-900 break-words">
                      {exam.title}
                    </h4>

                    <p className="text-sm text-gray-500 mt-1 break-words">
                      {exam.courses?.course_name}
                    </p>

                    <p className="text-sm text-gray-500">
                      Duration: {exam.duration} mins
                    </p>

                    <Link
                      to={`/student/exam/${exam.id}`}
                      className="block text-center mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl font-semibold"
                    >
                      Take Exam
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        {showJoinModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-5 sm:p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold">
                  Join Course
                </h3>

                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-gray-500 text-xl"
                >
                  ✕
                </button>
              </div>

              <p className="text-gray-500 mb-5">
                Enter the joining code provided by your
                professor.
              </p>

              <form
                onSubmit={handleJoinCourse}
                className="space-y-4"
              >
                <input
                  value={joiningCode}
                  onChange={(e) =>
                    setJoiningCode(
                      e.target.value.toUpperCase()
                    )
                  }
                  className="w-full border rounded-2xl px-4 py-3"
                  placeholder="Enter joining code"
                  required
                />

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold">
                  Join Course
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </StudentTopbarLayout>
  );
}

export default StudentDashboard;