import { useEffect, useState } from "react";
import ProfessorTopbarLayout from "../../layouts/ProfessorTopbarLayout";
import { Link } from "react-router-dom";
import {
  Monitor,
  Upload,
  BarChart3,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

function ProfessorDashboard() {
  const [recentExams, setRecentExams] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [courses, setCourses] = useState([]);

  const fetchProfessorDashboardData = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data: examsData } = await supabase
      .from("exams")
      .select(`
        *,
        courses (
          course_name,
          section
        )
      `)
      .eq("professor_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: coursesData } = await supabase
      .from("courses")
      .select("*")
      .eq("professor_id", userData.user.id);

    const { data: violationsData } = await supabase
      .from("violations")
      .select(`
        *,
        profiles:student_id (
          full_name,
          school_id
        ),
        exam_attempts:attempt_id (
          exams (
            title,
            professor_id,
            courses (
              course_name,
              section
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    const professorAlerts = (violationsData || []).filter(
      (v) => v.exam_attempts?.exams?.professor_id === userData.user.id
    );

    setRecentExams(examsData || []);
    setCourses(coursesData || []);
    setLiveAlerts(professorAlerts.slice(0, 5));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfessorDashboardData();
  }, []);

  const publishedExams = recentExams.filter(
    (exam) => exam.status === "published"
  );

  return (
    <ProfessorTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Professor Dashboard
        </h2>

        <p className="text-sm sm:text-base text-gray-500">
          Manage your courses, exams, scores, and monitoring alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">My Courses</p>

          <h3 className="text-3xl font-bold mt-2">
            {courses.length}
          </h3>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Created Exams</p>

          <h3 className="text-3xl font-bold mt-2">
            {recentExams.length}
          </h3>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Published Exams</p>

          <h3 className="text-3xl font-bold mt-2">
            {publishedExams.length}
          </h3>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Total Alerts</p>

          <h3 className="text-3xl font-bold mt-2">
            {liveAlerts.length}
          </h3>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-3xl shadow p-5 sm:p-6 border border-gray-100">
        <h3 className="text-xl font-bold mb-4">
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link
            to="/professor/exams"
            className="bg-blue-50 hover:bg-blue-100 rounded-3xl p-5 transition"
          >
            <FileText className="w-7 h-7 text-blue-700 mb-3" />
            <p className="font-bold">Create Exam</p>
          </Link>

          <Link
            to="/professor/monitoring"
            className="bg-red-50 hover:bg-red-100 rounded-3xl p-5 transition"
          >
            <Monitor className="w-7 h-7 text-red-700 mb-3" />
            <p className="font-bold">
              Open Monitoring Center
            </p>
          </Link>

          <Link
            to="/professor/resources"
            className="bg-green-50 hover:bg-green-100 rounded-3xl p-5 transition"
          >
            <Upload className="w-7 h-7 text-green-700 mb-3" />
            <p className="font-bold">Upload Resources</p>
          </Link>

          <Link
            to="/professor/scores"
            className="bg-purple-50 hover:bg-purple-100 rounded-3xl p-5 transition"
          >
            <BarChart3 className="w-7 h-7 text-purple-700 mb-3" />
            <p className="font-bold">View Scores</p>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <section className="bg-white rounded-3xl shadow p-5 sm:p-6 border border-gray-100">
          <h3 className="text-xl font-bold mb-4">
            Recent Exams
          </h3>

          {recentExams.length === 0 ? (
            <p className="text-gray-500">
              No recent exams yet.
            </p>
          ) : (
            <div className="space-y-4">
              {recentExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-gray-50 rounded-3xl p-5 border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {exam.title}
                      </h4>

                      <p className="text-sm text-gray-500">
                        {exam.courses?.course_name ||
                          "No Course"}{" "}
                        {exam.courses?.section
                          ? `- ${exam.courses.section}`
                          : ""}
                      </p>

                      <p
                        className={`text-sm font-semibold mt-1 ${
                          exam.status === "published"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {exam.status || "draft"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Link
                      to="/professor/scores"
                      className="px-4 py-2 bg-blue-600 text-white rounded-2xl text-sm font-semibold"
                    >
                      View Scores
                    </Link>

                    <Link
                      to="/professor/monitoring"
                      className="px-4 py-2 bg-gray-900 text-white rounded-2xl text-sm font-semibold"
                    >
                      Open Monitoring
                    </Link>

                    <Link
                      to="/professor/exams"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold"
                    >
                      Edit Exam
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow p-5 sm:p-6 border border-gray-100">
          <h3 className="text-xl font-bold mb-4">
            Live Monitoring Alerts
          </h3>

          {liveAlerts.length === 0 ? (
            <p className="text-gray-500">
              No live alerts yet.
            </p>
          ) : (
            <div className="space-y-3">
              {liveAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-red-50 rounded-3xl p-4 border border-red-100 flex gap-3"
                >
                  <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />

                  <div>
                    <p className="font-bold text-gray-900">
                      {alert.profiles?.full_name ||
                        "Unknown Student"}
                    </p>

                    <p className="text-sm text-red-600 font-semibold">
                      {alert.violation_type}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {alert.created_at
                        ? new Date(
                            alert.created_at
                          ).toLocaleString()
                        : "No date"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ProfessorTopbarLayout>
  );
}

export default ProfessorDashboard;