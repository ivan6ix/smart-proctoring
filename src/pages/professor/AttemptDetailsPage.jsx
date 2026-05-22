import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import ProfessorTopbarLayout from "../../layouts/ProfessorTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function AttemptDetailsPage() {
  const { attemptId } = useParams();

  const [answers, setAnswers] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [manualScores, setManualScores] = useState({});

  const fetchAttemptDetails = async () => {
    const { data: attemptData } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        profiles:student_id (
          full_name,
          school_id
        ),
        exams (
          id,
          title,
          exam_type,
          period,
          duration,
          courses (
            course_name,
            section
          )
        )
      `)
      .eq("id", attemptId)
      .single();

    const { data: answersData, error } = await supabase
      .from("student_answers")
      .select(`
        *,
        questions (
          question,
          correct_answer,
          points,
          question_type
        )
      `)
      .eq("attempt_id", attemptId);

    if (!error) {
      setAttempt(attemptData);
      setAnswers(answersData || []);

      const scores = {};
      (answersData || []).forEach((answer) => {
        scores[answer.id] = answer.points_earned ?? "";
      });
      setManualScores(scores);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAttemptDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recomputeTotalScore = async () => {
    const { data: answersData, error: answersError } = await supabase
      .from("student_answers")
      .select("points_earned")
      .eq("attempt_id", attemptId);

    if (answersError) {
      alert(answersError.message);
      return;
    }

    const totalScore = (answersData || []).reduce(
      (sum, ans) => sum + Number(ans.points_earned || 0),
      0
    );

    const { error: attemptError } = await supabase
      .from("exam_attempts")
      .update({
        score: totalScore,
        grading_status: "manual_checked",
      })
      .eq("id", attemptId);

    if (attemptError) {
      alert(attemptError.message);
      return;
    }

    const { error: gradeError } = await supabase.from("final_grades").upsert(
      {
        student_id: attempt.student_id,
        exam_id: attempt.exam_id,
        highest_score: totalScore,
      },
      {
        onConflict: "student_id,exam_id",
      }
    );

    if (gradeError) {
      alert(gradeError.message);
      return;
    }

    await fetchAttemptDetails();
  };

  const handleSaveManualScore = async (answer) => {
    const rawScore = manualScores[answer.id];

    if (rawScore === "" || rawScore === null || rawScore === undefined) {
      alert("Please enter a score.");
      return;
    }

    const score = Number(rawScore);
    const maxPoints = Number(answer.questions?.points || 0);

    if (Number.isNaN(score)) {
      alert("Invalid score.");
      return;
    }

    if (score < 0 || score > maxPoints) {
      alert(`Score must be between 0 and ${maxPoints}.`);
      return;
    }

    const { error } = await supabase
      .from("student_answers")
      .update({
        points_earned: score,
        needs_manual_check: false,
        is_correct: null,
      })
      .eq("id", answer.id);

    if (error) {
      alert(error.message);
      return;
    }

    await recomputeTotalScore();
    alert("Manual score saved.");
  };

  const correctCount = answers.filter(
    (answer) => answer.is_correct === true
  ).length;

  const wrongCount = answers.filter(
    (answer) => answer.is_correct === false
  ).length;

  const manualCount = answers.filter(
    (answer) => answer.needs_manual_check
  ).length;

  return (
    <ProfessorTopbarLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Student Answers
          </h2>

          <p className="text-gray-500">
            Review submitted answers and manually grade essay-type questions.
          </p>
        </div>

        <Link
          to="/professor/scores"
          className="w-full sm:w-auto text-center bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-2xl font-semibold"
        >
          Back to Scores
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-3xl shadow border border-gray-100 p-5">
          <p className="text-gray-500">Student</p>
          <h3 className="font-bold text-lg mt-1">
            {attempt?.profiles?.full_name || "Unknown Student"}
          </h3>
          <p className="text-sm text-gray-500">
            {attempt?.profiles?.school_id || "No School ID"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow border border-gray-100 p-5">
          <p className="text-gray-500">Exam</p>
          <h3 className="font-bold text-lg mt-1">
            {attempt?.exams?.title || "Unknown Exam"}
          </h3>
          <p className="text-sm text-gray-500">
            {attempt?.exams?.courses?.course_name || "No Course"} -{" "}
            {attempt?.exams?.courses?.section || "No Section"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow border border-gray-100 p-5">
          <p className="text-gray-500">Score</p>
          <h3 className="text-3xl font-bold mt-1">{attempt?.score ?? 0}</h3>
        </div>

        <div className="bg-white rounded-3xl shadow border border-gray-100 p-5">
          <p className="text-gray-500">Result</p>
          <h3 className="font-bold text-green-600 mt-1">
            {correctCount} Correct
          </h3>
          <p className="text-sm text-red-600">{wrongCount} Wrong</p>
          <p className="text-sm text-yellow-600">
            {manualCount} Pending Manual
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
        <h3 className="text-xl font-bold mb-5">Answers Review</h3>

        {answers.length === 0 ? (
          <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
            No answers found.
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer, index) => {
              const isManual = answer.needs_manual_check === true;

              return (
                <div
                  key={answer.id}
                  className={`rounded-3xl p-5 border ${
                    isManual
                      ? "bg-yellow-50 border-yellow-100"
                      : answer.is_correct
                      ? "bg-green-50 border-green-100"
                      : answer.is_correct === false
                      ? "bg-red-50 border-red-100"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isManual ? (
                      <Clock className="w-6 h-6 text-yellow-600 shrink-0 mt-1" />
                    ) : answer.is_correct ? (
                      <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                    ) : answer.is_correct === false ? (
                      <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                    ) : (
                      <Clock className="w-6 h-6 text-gray-500 shrink-0 mt-1" />
                    )}

                    <div className="flex-1">
                      <p className="font-bold text-gray-900 mb-3">
                        {index + 1}. {answer.questions?.question}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white rounded-2xl p-4 border border-gray-100">
                          <p className="text-xs text-gray-500">
                            Student Answer
                          </p>
                          <p className="font-semibold text-gray-900 whitespace-pre-wrap">
                            {answer.answer || "No answer"}
                          </p>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-gray-100">
                          <p className="text-xs text-gray-500">
                            Correct Answer
                          </p>
                          <p className="font-semibold text-gray-900">
                            {answer.questions?.correct_answer || "N/A"}
                          </p>
                        </div>
                      </div>

                      {isManual ? (
                        <div className="mt-4 bg-white rounded-2xl p-4 border border-yellow-100">
                          <p className="font-bold text-yellow-700 mb-3">
                            Manual Checking Required
                          </p>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="number"
                              min="0"
                              max={answer.questions?.points || 0}
                              value={manualScores[answer.id] ?? ""}
                              onChange={(e) =>
                                setManualScores({
                                  ...manualScores,
                                  [answer.id]: e.target.value,
                                })
                              }
                              className="w-full sm:w-40 border rounded-xl px-4 py-3"
                              placeholder="Score"
                            />

                            <button
                              onClick={() => handleSaveManualScore(answer)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
                            >
                              Save Score
                            </button>
                          </div>

                          <p className="text-sm text-gray-500 mt-2">
                            Max points: {answer.questions?.points || 0}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 font-bold text-gray-700">
                          Points: {answer.points_earned ?? 0}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProfessorTopbarLayout>
  );
}

export default AttemptDetailsPage;