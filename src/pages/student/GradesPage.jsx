import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import StudentTopbarLayout from "../../layouts/StudentTopbarLayout";

function GradesPage() {
  const [grades, setGrades] = useState([]);
  const [viewMode, setViewMode] = useState("current");
  const [openCourse, setOpenCourse] = useState(null);

  const fetchGrades = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("final_grades")
      .select(`
        *,
        exams (
          title,
          period,
          exam_type,
          questions (
            points
          ),
          courses (
            id,
            course_name,
            course_code,
            section
          )
        )
      `)
      .eq("student_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setGrades(data || []);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGrades();
  }, []);

  const getPercent = (grade) => {
    const totalPoints = grade.exams?.questions?.reduce(
      (sum, q) => sum + Number(q.points || 0),
      0
    );

    return totalPoints > 0
      ? (Number(grade.highest_score || 0) / totalPoints) * 100
      : 0;
  };

  const groupedCourses = grades.reduce((acc, grade) => {
    const course = grade.exams?.courses;
    const courseId = course?.id || "unknown";

    if (!acc[courseId]) {
      acc[courseId] = {
        course,
        grades: [],
      };
    }

    acc[courseId].grades.push(grade);
    return acc;
  }, {});

  const courseList = Object.values(groupedCourses);

  return (
    <StudentTopbarLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Grades
          </h2>

          <p className="text-sm sm:text-base text-gray-500">
            View your current and past course grades.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow p-2 flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setViewMode("current")}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-semibold ${
              viewMode === "current"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Current
          </button>

          <button
            onClick={() => setViewMode("past")}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-semibold ${
              viewMode === "past"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Past
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {courseList.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-10 text-center text-gray-500">
            No grades available yet.
          </div>
        ) : (
          courseList.map((item) => {
            const course = item.course;
            const isOpen = openCourse === course?.id;

            const total =
              item.grades.reduce((sum, grade) => sum + getPercent(grade), 0) /
              item.grades.length;

            return (
              <div
                key={course?.id}
                className="bg-white rounded-3xl shadow border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenCourse(isOpen ? null : course?.id)}
                  className="w-full p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left"
                >
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {course?.course_name || "Unknown Course"}
                    </h3>

                    <p className="text-sm sm:text-base text-gray-500">
                      {course?.course_code} - {course?.section}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div className="bg-blue-50 text-blue-700 px-5 py-3 rounded-2xl font-bold">
                      {total.toFixed(1)}%
                    </div>

                    <span className="text-2xl">{isOpen ? "⌃" : "⌄"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6">
                    <div className="bg-gray-50 rounded-3xl p-4 sm:p-5">
                      <h4 className="font-bold mb-4">
                        Academic Year 2025-2026
                      </h4>

                      <div className="space-y-4">
                        {item.grades.map((grade) => {
                          const percent = getPercent(grade);

                          return (
                            <div
                              key={grade.id}
                              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="font-bold">
                                    {grade.exams?.period || "Semester"}
                                  </p>

                                  <p className="text-gray-500 text-sm">
                                    {grade.exams?.title} •{" "}
                                    {grade.exams?.exam_type}
                                  </p>
                                </div>

                                <div className="font-bold text-blue-700">
                                  {percent.toFixed(1)}%
                                </div>
                              </div>

                              <div className="mt-4 bg-gray-200 h-3 rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full"
                                  style={{
                                    width: `${percent}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 bg-blue-50 rounded-2xl p-5 flex items-center justify-between">
                        <p className="font-bold text-gray-700">
                          Course Grade:
                        </p>

                        <p className="text-2xl font-bold text-blue-700">
                          {total.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </StudentTopbarLayout>
  );
}

export default GradesPage;