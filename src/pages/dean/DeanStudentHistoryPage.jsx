import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import DeanTopbarLayout from "../../layouts/DeanTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function DeanStudentHistoryPage() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [violations, setViolations] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [logs, setLogs] = useState([]);

  const fetchStudentHistory = async () => {
    const { data: studentData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    const { data: violationsData } = await supabase
      .from("violations")
      .select("*")
      .eq("student_id", id)
      .order("created_at", { ascending: false });

    const { data: attemptsData } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        exams (
          title
        )
      `)
      .eq("student_id", id)
      .order("created_at", { ascending: false });

    const { data: logsData } = await supabase
      .from("system_logs")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    setStudent(studentData);
    setViolations(violationsData || []);
    setAttempts(attemptsData || []);
    setLogs(logsData || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudentHistory();
  }, []);

  return (
    <DeanTopbarLayout>
      <style>
        {`
          @media print {
            button, .no-print {
              display: none !important;
            }

            body {
              background: white !important;
            }

            .print-card {
              box-shadow: none !important;
              border: 1px solid #ddd !important;
              break-inside: avoid;
            }
          }
        `}
      </style>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Student History Logs</h2>

          <p className="text-gray-500">
            {student?.full_name} • {student?.school_id || "No School ID"}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="no-print bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Print / Save as PDF
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white rounded-3xl shadow border p-5 print-card">
          <h3 className="font-bold text-xl mb-4">
            Violations
          </h3>

          <div className="space-y-3">
            {violations.length === 0 ? (
              <p className="text-gray-500">No violations found.</p>
            ) : (
              violations.map((v) => (
                <div
                  key={v.id}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4"
                >
                  <p className="font-bold">
                    {v.violation_type}
                  </p>

                  <p className="text-sm text-gray-600">
                    {v.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow border p-5 print-card">
          <h3 className="font-bold text-xl mb-4">
            Exam Attempts
          </h3>

          <div className="space-y-3">
            {attempts.length === 0 ? (
              <p className="text-gray-500">No exam attempts found.</p>
            ) : (
              attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="bg-blue-50 border border-blue-100 rounded-2xl p-4"
                >
                  <p className="font-bold">
                    {attempt.exams?.title}
                  </p>

                  <p className="text-sm text-gray-600">
                    Score: {attempt.score || 0}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow border p-5 print-card">
          <h3 className="font-bold text-xl mb-4">
            Account Logs
          </h3>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-gray-500">No account logs found.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-4"
                >
                  <p className="font-bold">
                    {log.action}
                  </p>

                  <p className="text-sm text-gray-600">
                    {log.description}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString()
                      : "No timestamp"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DeanTopbarLayout>
  );
}

export default DeanStudentHistoryPage;