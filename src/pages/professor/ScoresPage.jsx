import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfessorTopbarLayout from "../../layouts/ProfessorTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function ScoresPage() {
  const [attempts, setAttempts] = useState([]);

  const fetchScores = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        exams (
          title,
          professor_id
        ),
        profiles:student_id (
          full_name,
          school_id
        )
      `)
      .eq("exams.professor_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setAttempts(data || []);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchScores();
  }, []);

  const ScoreBadge = ({ attempt }) => {
    if (attempt.grading_status === "pending_manual_check") {
      return (
        <span className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-2xl font-bold text-sm">
          Pending Manual Check
        </span>
      );
    }

    return (
      <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl font-bold">
        {attempt.score ?? 0}
      </span>
    );
  };

  return (
    <ProfessorTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Student Scores
        </h2>

        <p className="text-sm sm:text-base text-gray-500">
          View submitted exam attempts, scores, and student answers.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Exam</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Attempt</th>
                <th className="px-6 py-4">Started</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4">Answers</th>
              </tr>
            </thead>

            <tbody>
              {attempts.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan="7">
                    No scores available yet.
                  </td>
                </tr>
              ) : (
                attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b">
                    <td className="px-6 py-4">
                      <p className="font-semibold">
                        {attempt.profiles?.full_name || "Unknown Student"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {attempt.profiles?.school_id || "No School ID"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      {attempt.exams?.title || "Untitled Exam"}
                    </td>

                    <td className="px-6 py-4">
                      <ScoreBadge attempt={attempt} />
                    </td>

                    <td className="px-6 py-4">
                      Attempt {attempt.attempt_number}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {attempt.started_at
                        ? new Date(attempt.started_at).toLocaleString()
                        : "N/A"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {attempt.submitted_at
                        ? new Date(attempt.submitted_at).toLocaleString()
                        : "N/A"}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        to={`/professor/attempt/${attempt.id}`}
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl font-semibold"
                      >
                        View Answers
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden p-4 space-y-4">
          {attempts.length === 0 ? (
            <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
              No scores available yet.
            </div>
          ) : (
            attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="bg-gray-50 rounded-3xl p-5 border border-gray-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {attempt.profiles?.full_name || "Unknown Student"}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {attempt.profiles?.school_id || "No School ID"}
                    </p>
                  </div>

                  <ScoreBadge attempt={attempt} />
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold text-gray-800">Exam:</span>{" "}
                    {attempt.exams?.title || "Untitled Exam"}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-800">
                      Attempt:
                    </span>{" "}
                    {attempt.attempt_number}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-800">
                      Started:
                    </span>{" "}
                    {attempt.started_at
                      ? new Date(attempt.started_at).toLocaleString()
                      : "N/A"}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-800">
                      Submitted:
                    </span>{" "}
                    {attempt.submitted_at
                      ? new Date(attempt.submitted_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>

                <Link
                  to={`/professor/attempt/${attempt.id}`}
                  className="block text-center mt-5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl font-semibold"
                >
                  View Answers
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </ProfessorTopbarLayout>
  );
}

export default ScoresPage;