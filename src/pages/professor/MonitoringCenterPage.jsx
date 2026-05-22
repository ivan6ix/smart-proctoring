import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProfessorTopbarLayout from "../../layouts/ProfessorTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function MonitoringCenterPage() {
  const [studentAlerts, setStudentAlerts] = useState([]);
  const [searchStudent, setSearchStudent] = useState("");
  const [selectedAlertType, setSelectedAlertType] = useState("All");

  const fetchViolations = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
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

    if (error) return;

    const professorViolations = (data || []).filter(
      (v) => v.exam_attempts?.exams?.professor_id === userData.user.id
    );

    const grouped = professorViolations.reduce((acc, violation) => {
      const studentId = violation.student_id;

      if (!acc[studentId]) {
        acc[studentId] = {
          student: violation.profiles,
          alerts: [],
        };
      }

      acc[studentId].alerts.push(violation);
      return acc;
    }, {});

    setStudentAlerts(Object.values(grouped));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchViolations();
  }, []);

  const allAlerts = useMemo(
    () => studentAlerts.flatMap((item) => item.alerts),
    [studentAlerts]
  );

  const filteredStudentAlerts = studentAlerts.filter((item) => {
    const name = item.student?.full_name || "";
    const schoolId = item.student?.school_id || "";
    const latest = item.alerts[0];

    const matchesSearch =
      name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      schoolId.toLowerCase().includes(searchStudent.toLowerCase());

    const matchesType =
      selectedAlertType === "All" ||
      latest?.violation_type === selectedAlertType;

    return matchesSearch && matchesType;
  });

  return (
    <ProfessorTopbarLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Monitoring Center
          </h2>

          <p className="text-sm sm:text-base text-gray-500">
            Review suspicious activities, exam alerts, and student violations.
          </p>
        </div>

        <Link
          to="/professor/dashboard"
          className="w-full sm:w-auto text-center bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Total Alerts</p>
          <h3 className="text-3xl font-bold mt-2">{allAlerts.length}</h3>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Tab Switch</p>
          <h3 className="text-3xl font-bold mt-2">
            {allAlerts.filter((v) => v.violation_type === "TAB_SWITCH").length}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Fullscreen Exit</p>
          <h3 className="text-3xl font-bold mt-2">
            {
              allAlerts.filter((v) => v.violation_type === "FULLSCREEN_EXIT")
                .length
            }
          </h3>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow border border-gray-100">
          <p className="text-gray-500">Audio / Conversation</p>
          <h3 className="text-3xl font-bold mt-2">
            {
              allAlerts.filter(
                (v) =>
                  v.violation_type === "LOUD_AUDIO" ||
                  v.violation_type === "POSSIBLE_CONVERSATION"
              ).length
            }
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow p-4 sm:p-6 border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="border rounded-2xl px-4 py-3"
            placeholder="Search student name or school ID..."
          />

          <select
            value={selectedAlertType}
            onChange={(e) => setSelectedAlertType(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          >
            <option>All</option>
            <option value="TAB_SWITCH">Tab Switch</option>
            <option value="FULLSCREEN_EXIT">Fullscreen Exit</option>
            <option value="NO_FACE">No Face Detected</option>
            <option value="LOUD_AUDIO">Loud Audio</option>
            <option value="POSSIBLE_CONVERSATION">
              Possible Conversation
            </option>
            <option value="DEVTOOLS">Developer Tools</option>
            <option value="SCREENSHOT_ATTEMPT">Screenshot Attempt</option>
          </select>
        </div>
      </div>

      <div className="space-y-5">
        {filteredStudentAlerts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-8 text-center border border-gray-100">
            <p className="text-gray-500">No suspicious activity recorded.</p>
          </div>
        ) : (
          filteredStudentAlerts.map((item) => {
            const latest = item.alerts[0];

            return (
              <div
                key={latest.student_id}
                className="bg-white rounded-3xl shadow p-5 sm:p-6 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {item.student?.full_name || "Unknown Student"}
                    </h3>

                    <p className="text-gray-500">
                      {item.student?.school_id || "No School ID"}
                    </p>
                  </div>

                  <div className="bg-red-100 text-red-600 px-4 py-2 rounded-2xl font-bold w-fit">
                    {item.alerts.length} Alerts
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-1 bg-black rounded-3xl h-44 flex items-center justify-center text-white text-sm">
                    Camera Preview
                  </div>

                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-xs text-gray-500">Course</p>
                      <p className="font-semibold text-gray-900">
                        {latest.exam_attempts?.exams?.courses?.course_name ||
                          "N/A"}{" "}
                        -{" "}
                        {latest.exam_attempts?.exams?.courses?.section ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-xs text-gray-500">Exam</p>
                      <p className="font-semibold text-gray-900">
                        {latest.exam_attempts?.exams?.title || "N/A"}
                      </p>
                    </div>

                    <div className="bg-red-50 rounded-2xl p-4">
                      <p className="text-xs text-red-500">Latest Alert</p>
                      <p className="font-semibold text-red-700">
                        {latest.description}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-xs text-gray-500">Timestamp</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(latest.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <Link
                    to={`/professor/suspicious/${latest.student_id}`}
                    className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold"
                  >
                    View Suspicious Activity
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ProfessorTopbarLayout>
  );
}

export default MonitoringCenterPage;