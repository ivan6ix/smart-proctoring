import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentTopbarLayout from "../../layouts/StudentTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

import {
  BookOpen,
  GraduationCap,
  Users,
  Folder,
} from "lucide-react";

function StudentCoursePage() {
  const { courseId } = useParams();

  const [activeTab, setActiveTab] = useState("materials");
  const [course, setCourse] = useState(null);
  const [grades, setGrades] = useState([]);
  const [members, setMembers] = useState([]);

  const fetchCourse = async () => {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .eq("is_archived", false)
      .single();

    setCourse(data || null);
  };

  const fetchGrades = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("final_grades")
      .select(`
        *,
        exams (
          title,
          exam_type,
          period,
          course_id
        )
      `)
      .eq("student_id", userData.user.id)
      .eq("exams.course_id", courseId)
      .order("created_at", { ascending: false });

    if (!error) {
      setGrades(data || []);
    }
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("course_students")
      .select(`
        *,
        profiles:student_id (
          full_name,
          school_id,
          role,
          is_archived
        )
      `)
      .eq("course_id", courseId);

    if (!error) {
      const activeMembers = (data || []).filter(
        (member) => !member.profiles?.is_archived
      );

      setMembers(activeMembers);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourse();
    fetchGrades();
    fetchMembers();
  }, []);

  const averageGrade =
    grades.length > 0
      ? grades.reduce(
          (sum, grade) => sum + Number(grade.highest_score || 0),
          0
        ) / grades.length
      : 0;

  if (!course) {
    return (
      <StudentTopbarLayout>
        <div className="bg-white rounded-3xl shadow p-10 border border-gray-100 text-center text-gray-500">
          Course not found or this course has been archived.
        </div>
      </StudentTopbarLayout>
    );
  }

  return (
    <StudentTopbarLayout>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">
          {course.course_name || "Course"}
        </h2>

        <p className="text-gray-500">
          {course.course_code} - {course.section}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="bg-white rounded-3xl shadow p-5 border border-gray-100 h-fit">
          <div className="space-y-3">
            <button
              onClick={() => setActiveTab("materials")}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-semibold transition ${
                activeTab === "materials"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Materials
            </button>

            <button
              onClick={() => setActiveTab("grades")}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-semibold transition ${
                activeTab === "grades"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Grades
            </button>

            <button
              onClick={() => setActiveTab("members")}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-semibold transition ${
                activeTab === "members"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Users className="w-5 h-5" />
              Members
            </button>
          </div>
        </aside>

        <section className="lg:col-span-3">
          {activeTab === "materials" && (
            <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
              <h3 className="text-2xl font-bold mb-2">Materials</h3>

              <p className="text-gray-500 mb-6">
                Course folders and uploaded materials from your professor.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Folder className="w-6 h-6 text-blue-600" />
                    <h4 className="font-bold text-lg">Quizzes</h4>
                  </div>

                  <div className="pl-9 space-y-2 text-gray-600">
                    <p>Quiz files will appear here.</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Folder className="w-6 h-6 text-green-600" />
                    <h4 className="font-bold text-lg">Activities</h4>
                  </div>

                  <div className="pl-9 space-y-2 text-gray-600">
                    <p>Activity files will appear here.</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Folder className="w-6 h-6 text-purple-600" />
                    <h4 className="font-bold text-lg">Modules</h4>
                  </div>

                  <div className="pl-9 space-y-2 text-gray-600">
                    <p>Module files will appear here.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "grades" && (
            <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold">Course Grades</h3>

                  <p className="text-gray-500">
                    Exams and scores for this course.
                  </p>
                </div>

                <div className="bg-blue-50 text-blue-700 px-5 py-3 rounded-2xl font-bold">
                  Course Grade: {averageGrade.toFixed(1)}%
                </div>
              </div>

              {grades.length === 0 ? (
                <div className="border border-dashed rounded-3xl p-10 text-center text-gray-500">
                  No grades yet for this course.
                </div>
              ) : (
                <div className="space-y-4">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="bg-gray-50 rounded-3xl p-5 border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-lg">
                            {grade.exams?.title}
                          </h4>

                          <p className="text-gray-500 text-sm">
                            {grade.exams?.exam_type} • {grade.exams?.period}
                          </p>

                          <p className="text-gray-400 text-sm">
                            Date:{" "}
                            {grade.created_at
                              ? new Date(grade.created_at).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>

                        <div className="text-2xl font-bold text-blue-700">
                          {grade.highest_score}%
                        </div>
                      </div>

                      <div className="mt-4 bg-gray-200 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{
                            width: `${Number(grade.highest_score || 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "members" && (
            <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
              <h3 className="text-2xl font-bold mb-2">Members</h3>

              <p className="text-gray-500 mb-6">
                Students enrolled in this course.
              </p>

              {members.length === 0 ? (
                <div className="border border-dashed rounded-3xl p-10 text-center text-gray-500">
                  No members found.
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {member.profiles?.full_name?.charAt(0) || "S"}
                      </div>

                      <div>
                        <p className="font-bold">
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
        </section>
      </div>
    </StudentTopbarLayout>
  );
}

export default StudentCoursePage;