import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs";
import hark from "hark";

function TakeExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const submittedRef = useRef(false);
  const warningsRef = useRef(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const faceModelRef = useRef(null);
  const speechEventsRef = useRef(null);
  const speechStartRef = useRef(null);
  const examStartedRef = useRef(false);

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [warnings, setWarnings] = useState(0);
  const [fullscreenStatus, setFullscreenStatus] = useState("Not started");
  const [tabStatus, setTabStatus] = useState("Active");
  const [cameraStatus, setCameraStatus] = useState("Not started");
  const [faceStatus, setFaceStatus] = useState("Not started");
  const [audioStatus, setAudioStatus] = useState("Not started");

  const [scanRequired, setScanRequired] = useState(true);
  const [scanStatus, setScanStatus] = useState("Not scanned");
  const [isScanning, setIsScanning] = useState(false);

  const N8N_WEBHOOK_URL = "https://collabify.app.n8n.cloud/webhook/environment-scan";

  const fetchExam = async () => {
    const { data: examData, error: examError } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .single();

    if (examError || !examData) {
      alert("Exam not found.");
      navigate("/student/exams");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { data: previousAttempts } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("exam_id", examId)
      .eq("student_id", userData.user.id)
      .eq("status", "submitted");

    const usedAttempts = previousAttempts?.length || 0;
    const maxAttempts = Number(examData.attempts || 1);

    if (usedAttempts >= maxAttempts) {
      alert("You already used all attempts for this exam.");
      navigate("/student/exams");
      return;
    }

    const { data: questionData } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId);

    setExam(examData);
    setQuestions(questionData || []);
    setTimeLeft(Number(examData.duration || 0) * 60);
  };

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setFullscreenStatus("Active");
    } catch {
      setFullscreenStatus("Fullscreen blocked");
    }
  };

  const startConversationDetection = (stream) => {
    const speechEvents = hark(stream, {
      interval: 100,
      threshold: -55,
    });

    speechEventsRef.current = speechEvents;

    speechEvents.on("speaking", () => {
      setAudioStatus("Possible voice detected");

      if (!speechStartRef.current) {
        speechStartRef.current = Date.now();
      }
    });

    speechEvents.on("stopped_speaking", () => {
      if (!speechStartRef.current) return;

      const duration = Date.now() - speechStartRef.current;

      if (duration >= 5000) {
        setAudioStatus("Possible conversation detected");
        addWarning(
          "Possible conversation detected near student.",
          "POSSIBLE_CONVERSATION"
        );
      } else {
        setAudioStatus("Listening for conversation...");
      }

      speechStartRef.current = null;
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      setTimeout(async () => {
        if (!videoRef.current) {
          setCameraStatus("Camera view not ready.");
          return;
        }

        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;

        await videoRef.current.play();

        setCameraStatus("Camera active");
        setAudioStatus("Microphone not started yet");
      }, 300);
    } catch (error) {
      console.log("Camera error:", error);
      setCameraStatus("Camera permission denied");
      alert("Camera permission is required.");
    }
  };

  const startMicrophone = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      audioStreamRef.current = audioStream;

      setAudioStatus("Listening for conversation...");
      startConversationDetection(audioStream);
    } catch (error) {
      console.log("Microphone error:", error);
      setAudioStatus("Microphone permission denied");
      alert("Microphone permission is required during the exam.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (speechEventsRef.current) {
      speechEventsRef.current.stop();
    }
  };

  const detectFace = async () => {
    try {
      if (!videoRef.current || !faceModelRef.current) return;

      faceIntervalRef.current = setInterval(async () => {
        if (
          !videoRef.current ||
          submittedRef.current ||
          !examStartedRef.current
        ) {
          return;
        }

        const predictions = await faceModelRef.current.estimateFaces(
          videoRef.current,
          false
        );

        if (predictions.length === 0) {
          setFaceStatus("No face detected");
          addWarning("No face detected in camera.", "NO_FACE");
        } else if (predictions.length > 1) {
          setFaceStatus("Multiple faces detected");
          addWarning("Multiple faces detected in camera.", "MULTIPLE_FACE");
        } else {
          setFaceStatus("Face detected");
        }
      }, 5000);
    } catch (error) {
      console.log(error);
      setFaceStatus("Face detection error");
    }
  };

  const saveViolation = async (type, description) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      await supabase.from("violations").insert({
        student_id: userData.user.id,
        violation_type: type,
        description,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const addWarning = async (reason, type = "GENERAL") => {
    if (submittedRef.current || !examStartedRef.current) return;

    const newWarnings = warningsRef.current + 1;
    warningsRef.current = newWarnings;
    setWarnings(newWarnings);

    await saveViolation(type, reason);

    alert(`Warning ${newWarnings}/3: ${reason}`);

    if (newWarnings >= 3) {
      alert("Too many violations. Exam will be submitted.");
      handleSubmitExam();
    }
  };

  const handleStartExam = async () => {
    setScanRequired(true);
    setScanStatus("Opening camera...");

    setTimeout(async () => {
      await startCamera();
      setScanStatus("Please scan your surroundings first.");
    }, 500);
  };

  const handleEnvironmentScan = async () => {
    if (!videoRef.current) return;

    setIsScanning(true);
    setScanStatus("Scanning... slowly show your surroundings.");

    const frames = [];

    for (let i = 0; i < 8; i++) {
      setScanStatus(`Scanning environment... ${i + 1}/8`);

      if (
        !videoRef.current ||
        videoRef.current.readyState < 2 ||
        videoRef.current.videoWidth === 0
      ) {
        setScanStatus("Waiting for camera to fully load...");

        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (
          !videoRef.current ||
          videoRef.current.readyState < 2 ||
          videoRef.current.videoWidth === 0
        ) {
          alert(
            "Camera is still loading. Please wait a few seconds then try again."
          );

          setIsScanning(false);
          return;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      let totalBrightness = 0;

      for (let p = 0; p < pixels.length; p += 4) {
        const r = pixels[p];
        const g = pixels[p + 1];
        const b = pixels[p + 2];

        totalBrightness += (r + g + b) / 3;
      }

      const averageBrightness = totalBrightness / (pixels.length / 4);

      if (averageBrightness < 25) {
        setScanStatus("Camera image too dark. Please improve lighting.");

        alert("Camera image is too dark. Please improve lighting and try again.");

        setIsScanning(false);
        return;
      }

      const imageBase64 = canvas.toDataURL("image/jpeg", 0.5);
      frames.push(imageBase64);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      setScanStatus("Analyzing environment...");

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exam_id: examId,
          scan_type: "environment_scan_sequence",
          frames,
        }),
      });

      const result = await response.json();

      if (
        result.status === "clear" ||
        result.hasSuspiciousObject === false ||
        result.output?.includes('"status":"clear"') ||
        result.output?.includes('"status": "clear"')
      ) {
        await enterFullscreen();
        await startMicrophone();

        examStartedRef.current = true;
        setExamStarted(true);
        setFullscreenStatus("Active");

        detectFace();
      } else if (result.status === "rescan_required") {
        setScanStatus(result.message || "Please rescan slowly.");
        alert(result.message || "Images are unclear. Please scan again slowly.");
      } else {
        setScanStatus("Suspicious object detected.");

        await saveViolation(
          "ENVIRONMENT_SCAN",
          result.message ||
            "Possible cheating material detected during environment scan."
        );

        alert(
          result.message ||
            "Possible suspicious item detected. Please remove it and scan again."
        );
      }
    } catch (error) {
      console.log(error);
      setScanStatus("Scan failed. Please try again.");
      alert("Environment scan failed. Please check your connection or webhook.");
    }

    setIsScanning(false);
  };

  const handleFullscreenChange = () => {
    if (!examStartedRef.current || submittedRef.current) return;

    if (!document.fullscreenElement) {
      setFullscreenStatus("Exited Fullscreen");
      addWarning("Fullscreen was exited.", "FULLSCREEN_EXIT");

      setTimeout(() => {
        enterFullscreen();
      }, 1000);
    } else {
      setFullscreenStatus("Active");
    }
  };

  const handleVisibilityChange = () => {
    if (!examStartedRef.current || submittedRef.current) return;

    if (document.hidden) {
      setTabStatus("Tab Changed");
      addWarning("You switched tabs or minimized the browser.", "TAB_SWITCH");
    } else {
      setTabStatus("Active");
    }
  };

  const handleKeyDown = (e) => {
    if (!examStartedRef.current) return;

    const key = e.key.toLowerCase();

    if (e.key === "F12") {
      e.preventDefault();
      addWarning("Developer tools shortcut detected.", "DEVTOOLS");
    }

    if (e.ctrlKey && e.shiftKey && key === "i") {
      e.preventDefault();
      addWarning("Inspect element shortcut detected.", "DEVTOOLS");
    }

    if (e.ctrlKey && e.shiftKey && key === "c") {
      e.preventDefault();
      addWarning("Inspect picker shortcut detected.", "DEVTOOLS");
    }

    if (e.ctrlKey && key === "u") {
      e.preventDefault();
      addWarning("View source shortcut detected.", "DEVTOOLS");
    }

    if (exam?.disable_copy_paste && e.ctrlKey && key === "c") {
      e.preventDefault();
      addWarning("Copy shortcut detected.", "COPY_ATTEMPT");
    }

    if (exam?.disable_copy_paste && e.ctrlKey && key === "v") {
      e.preventDefault();
      addWarning("Paste shortcut detected.", "PASTE_ATTEMPT");
    }

    if (exam?.disable_copy_paste && e.ctrlKey && key === "x") {
      e.preventDefault();
      addWarning("Cut shortcut detected.", "CUT_ATTEMPT");
    }

    if (e.key === "PrintScreen") {
      addWarning("Screenshot attempt detected.", "SCREENSHOT_ATTEMPT");
    }

    if (e.shiftKey && e.metaKey && key === "s") {
      addWarning("Snipping tool shortcut detected.", "SCREENSHOT_ATTEMPT");
    }

    if (e.altKey && key === "tab") {
      addWarning("Application switching detected.", "APP_SWITCH");
    }

    if (e.ctrlKey && key === "tab") {
      addWarning("Browser tab switching shortcut detected.", "TAB_SWITCH");
    }

    if (e.ctrlKey && key === "t") {
      e.preventDefault();
      addWarning("New tab shortcut detected.", "TAB_SWITCH");
    }

    if (e.ctrlKey && key === "n") {
      e.preventDefault();
      addWarning("New window shortcut detected.", "WINDOW_SWITCH");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const checkAnswer = (question, answer) => {
    if (!answer) return false;

    return (
      String(answer).trim().toLowerCase() ===
      String(question.correct_answer).trim().toLowerCase()
    );
  };

  const handleSubmitExam = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const { data: userData } = await supabase.auth.getUser();

    const { data: previousAttempts } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("exam_id", examId)
      .eq("student_id", userData.user.id)
      .eq("status", "submitted");

    const nextAttemptNumber = (previousAttempts?.length || 0) + 1;

    if (nextAttemptNumber > Number(exam.attempts || 1)) {
      alert("You have already used all attempts for this exam.");
      navigate("/student/exams");
      return;
    }

    let totalScore = 0;

    const { data: attemptData, error: attemptError } = await supabase
      .from("exam_attempts")
      .insert({
        exam_id: examId,
        student_id: userData.user.id,
        attempt_number: nextAttemptNumber,
        started_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        status: "submitted",
      })
      .select()
      .single();

    if (attemptError) {
      submittedRef.current = false;
      alert(attemptError.message);
      return;
    }

    const studentAnswers = questions.map((question) => {
      const answer = answers[question.id] || "";

      const manualTypes = ["Essay", "Reflection", "Analysis"];
      const needsManual = manualTypes.includes(question.question_type);
      const isCorrect = needsManual ? null : checkAnswer(question, answer);

      const pointsEarned = needsManual
        ? null
        : isCorrect
        ? Number(question.points || 1)
        : 0;

      if (!needsManual) {
        totalScore += pointsEarned;
      }

      return {
        attempt_id: attemptData.id,
        question_id: question.id,
        answer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        needs_manual_check: needsManual,
      };
    });

    const { error: answersError } = await supabase
      .from("student_answers")
      .insert(studentAnswers);

    if (answersError) {
      submittedRef.current = false;
      alert(answersError.message);
      return;
    }

    const hasManualQuestions = questions.some((q) =>
      ["Essay", "Reflection", "Analysis"].includes(q.question_type)
    );

    await supabase
      .from("exam_attempts")
      .update({
        score: totalScore,
        grading_status: hasManualQuestions
          ? "pending_manual_check"
          : "auto_checked",
      })
      .eq("id", attemptData.id);

    await supabase
      .from("violations")
      .update({ attempt_id: attemptData.id })
      .eq("student_id", userData.user.id)
      .is("attempt_id", null);

    const { data: existingGrade } = await supabase
      .from("final_grades")
      .select("*")
      .eq("student_id", userData.user.id)
      .eq("exam_id", examId)
      .maybeSingle();

    if (!existingGrade) {
      await supabase.from("final_grades").insert({
        student_id: userData.user.id,
        exam_id: examId,
        highest_score: totalScore,
      });
    } else if (totalScore > Number(existingGrade.highest_score)) {
      await supabase
        .from("final_grades")
        .update({ highest_score: totalScore })
        .eq("id", existingGrade.id);
    }

    setScore(totalScore);
    stopCamera();

    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
    }

    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    if (hasManualQuestions) {
      alert("Exam submitted. Some answers are pending manual checking.");
    } else {
      alert(`Exam submitted. Your score is ${totalScore}.`);
    }

    navigate("/student/grades");
  };

  useEffect(() => {
    fetchExam();

    const loadFaceModel = async () => {
      faceModelRef.current = await blazeface.load();
    };

    loadFaceModel();

    return () => {
      stopCamera();

      if (faceIntervalRef.current) {
        clearInterval(faceIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    examStartedRef.current = examStarted;
  }, [examStarted]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examStarted, exam]);

  useEffect(() => {
    if (!examStarted || timeLeft === null || score !== null) return;

    if (timeLeft <= 0) {
      alert("Time is up. Your exam will be submitted automatically.");
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, score, examStarted]);

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading exam...</p>
      </div>
    );
  }

  if (!examStarted && scanRequired && scanStatus !== "Not scanned") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-xl w-full text-center">
          <h2 className="text-2xl font-bold mb-3">
            Environment Scan Required
          </h2>

          <p className="text-gray-500 mb-5">
            Please slowly scan center/front, left side, right side, upper
            surroundings, and desk area before starting the exam.
          </p>

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ transform: "scaleX(-1)" }}
            className="bg-black rounded-2xl h-64 w-full object-cover mb-5"
          />

          <p className="text-sm text-gray-500 mb-5">{scanStatus}</p>

          <button
            onClick={handleEnvironmentScan}
            disabled={isScanning}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-2xl font-bold"
          >
            {isScanning ? "Scanning..." : "Start Environment Scan"}
          </button>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-3">{exam.title}</h2>

          <p className="text-gray-500 mb-6">
            Click the button below to open your camera and scan your
            environment before starting the exam.
          </p>

          <button
            onClick={handleStartExam}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold"
          >
            Start Environment Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-100 select-none"
      onCopy={(e) => exam.disable_copy_paste && e.preventDefault()}
      onPaste={(e) => exam.disable_copy_paste && e.preventDefault()}
      onCut={(e) => exam.disable_copy_paste && e.preventDefault()}
      onContextMenu={(e) => exam.disable_copy_paste && e.preventDefault()}
    >
      <div className="sticky top-0 z-50 bg-white shadow px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{exam.title}</h2>
          <p className="text-sm text-gray-500">Exam Mode</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-red-50 text-red-600 px-5 py-3 rounded-xl font-bold text-xl">
            {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
          </div>

          <div className="bg-red-50 text-red-600 px-5 py-3 rounded-xl font-bold">
            Warnings: {warnings}/3
          </div>

          <button
            onClick={handleSubmitExam}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
          >
            Submit Exam
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <p className="text-gray-600">{exam.instructions}</p>
        </div>

        <div className="space-y-5">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white border rounded-2xl p-5 shadow">
              <p className="font-semibold mb-4">
                {index + 1}. {q.question}
              </p>

              {q.question_type === "Multiple Choice" && (
                <div className="space-y-3">
                  {[
                    { label: "Option A", value: q.option_a },
                    { label: "Option B", value: q.option_b },
                    { label: "Option C", value: q.option_c },
                    { label: "Option D", value: q.option_d },
                  ].map((option) => (
                    <label
                      key={option.label}
                      className="block border rounded-xl p-3"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={option.label}
                        checked={answers[q.id] === option.label}
                        onChange={(e) =>
                          handleAnswerChange(q.id, e.target.value)
                        }
                        className="mr-2"
                      />
                      {option.value}
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === "True or False" && (
                <div className="space-y-3">
                  {["True", "False"].map((choice) => (
                    <label key={choice} className="block border rounded-xl p-3">
                      <input
                        type="radio"
                        name={q.id}
                        value={choice}
                        checked={answers[q.id] === choice}
                        onChange={(e) =>
                          handleAnswerChange(q.id, e.target.value)
                        }
                        className="mr-2"
                      />
                      {choice}
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === "Identification" && (
                <input
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full border rounded-xl px-4 py-3"
                  placeholder="Your answer"
                />
              )}

              {["Essay", "Reflection", "Analysis"].includes(
                q.question_type
              ) && (
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full border rounded-2xl px-4 py-4 min-h-[180px]"
                  placeholder="Write your answer here..."
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-xl p-3 w-64">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ transform: "scaleX(-1)" }}
          className="bg-black rounded-xl h-32 w-full object-cover mb-3"
        />

        <div className="text-xs space-y-1">
          <p>Camera: {cameraStatus}</p>
          <p>Face: {faceStatus}</p>
          <p>Audio: {audioStatus}</p>
          <p>Fullscreen: {fullscreenStatus}</p>
          <p>Tab: {tabStatus}</p>
        </div>
      </div>
    </div>
  );
}

export default TakeExamPage;
