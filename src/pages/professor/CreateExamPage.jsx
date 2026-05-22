import { useEffect, useState } from "react";
import ProfessorTopbarLayout from "../../layouts/ProfessorTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function CreateExamPage() {
  const [courses, setCourses] = useState([]);

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState("");
  const [period, setPeriod] = useState("");
  const [semester, setSemester] = useState("");
  const [duration, setDuration] = useState("");
  const [attempts, setAttempts] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("draft");
  const [instructions, setInstructions] = useState("");

  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeChoices, setRandomizeChoices] = useState(false);
  const [disableCopyPaste, setDisableCopyPaste] = useState(false);
  const [requireFullscreen, setRequireFullscreen] = useState(false);

  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [points, setPoints] = useState(1);
  const [questions, setQuestions] = useState([]);

  const fetchCourses = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("professor_id", userData.user.id);

    if (!error) {
      setCourses(data || []);
    }
  };

  const resetQuestionForm = () => {
    setQuestion("");
    setQuestionType("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("");
    setPoints(1);
  };

  const handleAddQuestion = () => {
    if (!question || !questionType) {
      alert("Please enter question and question type.");
      return;
    }

    setQuestions([
      ...questions,
      {
        question,
        question_type: questionType,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: correctAnswer,
        points,
      },
    ]);

    resetQuestionForm();
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();

    const confirmSave = window.confirm(
      "Are you sure you want to save this exam?"
    );

    if (!confirmSave) return;

    if (!courseId) {
      alert("Please select a course.");
      return;
    }

    if (!deadline) {
      alert("Please set an exam deadline.");
      return;
    }

    if (questions.length === 0) {
      alert("Please add at least one question.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { data: examData, error: examError } = await supabase
      .from("exams")
      .insert({
        course_id: courseId,
        professor_id: userData.user.id,
        title,
        exam_type: examType,
        period,
        semester,
        instructions,
        duration: Number(duration),
        attempts: Number(attempts),
        deadline,
        status,
        randomize_questions: randomizeQuestions,
        randomize_choices: randomizeChoices,
        disable_copy_paste: disableCopyPaste,
        require_fullscreen: requireFullscreen,
      })
      .select()
      .single();

    if (examError) {
      alert(examError.message);
      return;
    }

    const questionsToInsert = questions.map((item) => ({
      ...item,
      exam_id: examData.id,
    }));

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (questionsError) {
      alert(questionsError.message);
      return;
    }

    alert("Exam saved successfully.");

    setCourseId("");
    setTitle("");
    setExamType("");
    setPeriod("");
    setSemester("");
    setDuration("");
    setAttempts("");
    setDeadline("");
    setStatus("draft");
    setInstructions("");
    setRandomizeQuestions(false);
    setRandomizeChoices(false);
    setDisableCopyPaste(false);
    setRequireFullscreen(false);
    setQuestions([]);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <ProfessorTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Create Exam
        </h2>

        <p className="text-sm sm:text-base text-gray-500">
          Build exam details, security settings, deadline, and questions.
        </p>
      </div>

      <form onSubmit={handleSaveExam} className="space-y-6">
        <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
          <h3 className="text-xl font-bold mb-5">Exam Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="border rounded-2xl px-4 py-3"
              required
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name} - {course.section}
                </option>
              ))}
            </select>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border rounded-2xl px-4 py-3"
              placeholder="Exam Title"
              required
            />

            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="border rounded-2xl px-4 py-3"
              required
            >
              <option value="">Exam Type</option>
              <option>Quiz</option>
              <option>Activity</option>
              <option>Exam</option>
            </select>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border rounded-2xl px-4 py-3"
              required
            >
              <option value="">Select Period</option>
              <option>Prelim</option>
              <option>Midterm</option>
              <option>Semi Final</option>
              <option>Final</option>
            </select>

            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="border rounded-2xl px-4 py-3"
              required
            >
              <option value="">Select Semester</option>
              <option>First Semester</option>
              <option>Second Semester</option>
              <option>Trimester</option>
            </select>

            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              type="number"
              className="border rounded-2xl px-4 py-3"
              placeholder="Time Duration (minutes)"
              required
            />

            <select
              value={attempts}
              onChange={(e) => setAttempts(e.target.value)}
              className="border rounded-2xl px-4 py-3"
              required
            >
              <option value="">Attempts</option>
              <option value="1">1 Attempt</option>
              <option value="2">2 Attempts</option>
              <option value="3">3 Attempts</option>
              <option value="4">4 Attempts</option>
            </select>

            <input
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              type="datetime-local"
              className="border rounded-2xl px-4 py-3"
              required
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded-2xl px-4 py-3"
            >
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
            </select>

            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="border rounded-2xl px-4 py-3 md:col-span-2"
              placeholder="Exam instructions"
              rows="4"
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
          <h3 className="text-xl font-bold mb-5">Exam Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: "Randomize question order per student",
                value: randomizeQuestions,
                setter: setRandomizeQuestions,
              },
              {
                label: "Randomize choices per student",
                value: randomizeChoices,
                setter: setRandomizeChoices,
              },
              {
                label: "Disable copy and paste during exam",
                value: disableCopyPaste,
                setter: setDisableCopyPaste,
              },
              {
                label: "Require fullscreen mode",
                value: requireFullscreen,
                setter: setRequireFullscreen,
              },
            ].map((setting) => (
              <label
                key={setting.label}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3"
              >
                <input
                  type="checkbox"
                  checked={setting.value}
                  onChange={(e) => setting.setter(e.target.checked)}
                  className="w-5 h-5"
                />

                <span className="font-medium text-gray-700">
                  {setting.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <h3 className="text-xl font-bold">Question Builder</h3>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-semibold"
                >
                  Add Question
                </button>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold"
                >
                  Save Exam
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Question Title"
              />

              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3"
              >
                <option value="">Question Type</option>
                <option>Multiple Choice</option>
                <option>True or False</option>
                <option>Identification</option>
                <option>Matching Type</option>
                <option>Essay</option>
                <option>Reflection</option>
                <option>Analysis</option>
              </select>

              {questionType === "Multiple Choice" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    className="w-full border rounded-2xl px-4 py-3"
                    placeholder="Option A"
                  />

                  <input
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    className="w-full border rounded-2xl px-4 py-3"
                    placeholder="Option B"
                  />

                  <input
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    className="w-full border rounded-2xl px-4 py-3"
                    placeholder="Option C"
                  />

                  <input
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    className="w-full border rounded-2xl px-4 py-3"
                    placeholder="Option D"
                  />

                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full border rounded-2xl px-4 py-3 md:col-span-2"
                  >
                    <option value="">Select Correct Answer</option>
                    <option value="Option A">Option A</option>
                    <option value="Option B">Option B</option>
                    <option value="Option C">Option C</option>
                    <option value="Option D">Option D</option>
                  </select>
                </div>
              )}

              {questionType === "True or False" && (
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full border rounded-2xl px-4 py-3"
                >
                  <option value="">Select Correct Answer</option>
                  <option>True</option>
                  <option>False</option>
                </select>
              )}

              {questionType === "Identification" && (
                <input
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full border rounded-2xl px-4 py-3"
                  placeholder="Correct Answer"
                />
              )}

              <input
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                type="number"
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Points"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
            <h3 className="text-xl font-bold mb-4">Added Questions</h3>

            {questions.length === 0 ? (
              <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
                No questions added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((item, index) => (
                  <div
                    key={`${item.question}-${index}`}
                    className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                  >
                    <p className="font-bold">
                      {index + 1}. {item.question}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.question_type} • {item.points} point(s)
                    </p>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(index)}
                      className="text-red-600 font-bold mt-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </form>
    </ProfessorTopbarLayout>
  );
}

export default CreateExamPage;