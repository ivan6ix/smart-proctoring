import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  FileText,
  Printer,
  Search,
  Users,
} from "lucide-react";
import AdminTopbarLayout from "../../layouts/AdminTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [violationFilter, setViolationFilter] = useState("all");

  const [profiles, setProfiles] = useState([]);
  const [violations, setViolations] = useState([]);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [grades, setGrades] = useState([]);
  const [logs, setLogs] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [previewType, setPreviewType] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchReports = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    const { data: violationsData } = await supabase
      .from("violations")
      .select(`
        *,
        profiles:student_id (
          full_name,
          school_id,
          role
        )
      `)
      .order("created_at", { ascending: false });

    const { data: examsData } = await supabase
      .from("exams")
      .select(`
        *,
        courses (
          course_name,
          course_code,
          section
        ),
        profiles:professor_id (
          full_name,
          school_id
        )
      `)
      .order("created_at", { ascending: false });

    const { data: coursesData } = await supabase
      .from("courses")
      .select(`
        *,
        profiles:professor_id (
          full_name,
          school_id
        )
      `)
      .order("created_at", { ascending: false });

    const { data: attemptsData } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        exams (
          title,
          exam_type,
          period,
          courses (
            course_name,
            section
          )
        ),
        profiles:student_id (
          full_name,
          school_id
        )
      `)
      .order("created_at", { ascending: false });

    const { data: gradesData } = await supabase
      .from("final_grades")
      .select(`
        *,
        exams (
          title,
          courses (
            course_name,
            section
          )
        ),
        profiles:student_id (
          full_name,
          school_id
        )
      `);

    const { data: logsData } = await supabase
      .from("system_logs")
      .select(`
        *,
        profiles:user_id (
          full_name,
          school_id,
          role
        )
      `)
      .order("created_at", { ascending: false });

    setProfiles(profilesData || []);
    setViolations(violationsData || []);
    setExams(examsData || []);
    setCourses(coursesData || []);
    setAttempts(attemptsData || []);
    setGrades(gradesData || []);
    setLogs(logsData || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports();
  }, []);

  const openStudentPreview = (student, type) => {
    setSelectedStudent(student);
    setPreviewType(type);
    setShowPreviewModal(true);
  };

  const students = profiles.filter((p) => p.role === "student");
  const professors = profiles.filter((p) => p.role === "professor");
  const deans = profiles.filter((p) => p.role === "dean");

  const filteredProfiles = profiles.filter((profile) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      profile.full_name?.toLowerCase().includes(keyword) ||
      profile.school_id?.toLowerCase().includes(keyword) ||
      profile.role?.toLowerCase().includes(keyword);

    const matchesRole = roleFilter === "all" || profile.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const filteredViolations = violations.filter((violation) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      violation.profiles?.full_name?.toLowerCase().includes(keyword) ||
      violation.profiles?.school_id?.toLowerCase().includes(keyword) ||
      violation.violation_type?.toLowerCase().includes(keyword);

    const matchesType =
      violationFilter === "all" || violation.violation_type === violationFilter;

    return matchesSearch && matchesType;
  });

  const filteredCourses = courses.filter((course) => {
    const keyword = search.toLowerCase();

    return (
      course.course_name?.toLowerCase().includes(keyword) ||
      course.course_code?.toLowerCase().includes(keyword) ||
      course.section?.toLowerCase().includes(keyword) ||
      course.profiles?.full_name?.toLowerCase().includes(keyword)
    );
  });

  const filteredExams = exams.filter((exam) => {
    const keyword = search.toLowerCase();

    return (
      exam.title?.toLowerCase().includes(keyword) ||
      exam.exam_type?.toLowerCase().includes(keyword) ||
      exam.period?.toLowerCase().includes(keyword) ||
      exam.courses?.course_name?.toLowerCase().includes(keyword) ||
      exam.profiles?.full_name?.toLowerCase().includes(keyword)
    );
  });

  const violationTypes = [...new Set(violations.map((v) => v.violation_type))];

  return (
    <AdminTopbarLayout>
      <style>
        {`
          @media print {
            button, select, input, .no-print {
              display: none !important;
            }

            body {
              background: white !important;
            }

            .print-area {
              padding: 0 !important;
            }

            .print-card {
              box-shadow: none !important;
              border: 1px solid #ddd !important;
              break-inside: avoid;
            }
          }
        `}
      </style>

      <div className="print-area">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admin Reports Center
            </h2>
            <p className="text-gray-500">
              View students, violations, courses, exams, professors, dean records,
              all users, and system logs.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-3xl shadow border p-5 print-card">
            <Users className="text-purple-600 mb-3" />
            <p className="text-gray-500">Students</p>
            <h3 className="text-3xl font-bold">{students.length}</h3>
          </div>

          <div className="bg-white rounded-3xl shadow border p-5 print-card">
            <Users className="text-blue-600 mb-3" />
            <p className="text-gray-500">Professors</p>
            <h3 className="text-3xl font-bold">{professors.length}</h3>
          </div>

          <div className="bg-white rounded-3xl shadow border p-5 print-card">
            <Users className="text-green-600 mb-3" />
            <p className="text-gray-500">Deans</p>
            <h3 className="text-3xl font-bold">{deans.length}</h3>
          </div>

          <div className="bg-white rounded-3xl shadow border p-5 print-card">
            <BookOpen className="text-green-600 mb-3" />
            <p className="text-gray-500">Courses</p>
            <h3 className="text-3xl font-bold">{courses.length}</h3>
          </div>

          <div className="bg-white rounded-3xl shadow border p-5 print-card">
            <FileText className="text-blue-600 mb-3" />
            <p className="text-gray-500">Exams</p>
            <h3 className="text-3xl font-bold">{exams.length}</h3>
          </div>

          <div className="bg-white rounded-3xl shadow border p-5 print-card">
            <AlertTriangle className="text-red-600 mb-3" />
            <p className="text-gray-500">Violations</p>
            <h3 className="text-3xl font-bold">{violations.length}</h3>
          </div>
        </div>

        <div className="no-print bg-white rounded-3xl shadow border p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, school ID, course, section..."
                className="w-full border rounded-2xl pl-12 pr-4 py-3"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-2xl px-4 py-3"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="professor">Professors</option>
              <option value="dean">Deans</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={violationFilter}
              onChange={(e) => setViolationFilter(e.target.value)}
              className="border rounded-2xl px-4 py-3"
            >
              <option value="all">All Violation Types</option>
              {violationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="no-print flex flex-wrap gap-2 mb-6">
          {[
            ["overview", "Overview"],
            ["all_users", "All Users"],
            ["students", "Students"],
            ["violations", "Violations"],
            ["courses", "Courses"],
            ["exams", "Exams"],
            ["professors", "Professors"],
            ["deans", "Deans"],
            ["attempts", "Exam Attempts"],
            ["grades", "Grades"],
            ["logs", "System Logs"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-2xl font-semibold ${
                activeTab === key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="bg-white rounded-3xl shadow border p-5 print-card">
              <h3 className="text-xl font-bold mb-4">Recent Violations</h3>

              {violations.length === 0 ? (
                <p className="text-gray-500">No violations recorded.</p>
              ) : (
                <div className="space-y-3">
                  {violations.slice(0, 8).map((v) => (
                    <div key={v.id} className="bg-red-50 rounded-2xl p-4">
                      <p className="font-bold">
                        {v.profiles?.full_name || "Unknown Student"}
                      </p>
                      <p className="text-sm text-red-600">{v.violation_type}</p>
                      <p className="text-sm text-gray-500">{v.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-3xl shadow border p-5 print-card">
              <h3 className="text-xl font-bold mb-4">Recent Exams Created</h3>

              {exams.length === 0 ? (
                <p className="text-gray-500">No exams created yet.</p>
              ) : (
                <div className="space-y-3">
                  {exams.slice(0, 8).map((exam) => (
                    <div key={exam.id} className="bg-gray-50 rounded-2xl p-4">
                      <p className="font-bold">{exam.title}</p>
                      <p className="text-sm text-gray-500">
                        {exam.courses?.course_name || "No Course"} -{" "}
                        {exam.courses?.section || "No Section"}
                      </p>
                      <p className="text-sm text-blue-600">
                        Created by {exam.profiles?.full_name || "Unknown Professor"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "all_users" && (
          <ReportList
            title="All Users Report"
            items={filteredProfiles}
            empty="No users found."
            render={(user) => (
              <>
                <p className="font-bold">{user.full_name || "Unnamed User"}</p>
                <p className="text-sm text-gray-500">{user.school_id || "No ID"}</p>
                <p className="text-sm text-blue-600 capitalize">Role: {user.role}</p>
                <p className="text-sm text-gray-500">
                  Status: {user.is_active ? "Active" : "Deactivated"}
                </p>
              </>
            )}
          />
        )}

        {activeTab === "students" && (
          <ReportList
            title="Student Records"
            items={filteredProfiles.filter((p) => p.role === "student")}
            empty="No students found."
            render={(student) => (
              <>
                <p className="font-bold">{student.full_name || "Unnamed Student"}</p>
                <p className="text-sm text-gray-500">
                  {student.school_id || "No School ID"}
                </p>
                <p className="text-sm text-blue-600">Role: {student.role}</p>

                <div className="flex flex-wrap gap-2 mt-4 no-print">
                  <button
                    onClick={() => openStudentPreview(student, "history")}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white"
                  >
                    View History
                  </button>

                  <button
                    onClick={() => openStudentPreview(student, "violations")}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white"
                  >
                    View Violations
                  </button>

                  <button
                    onClick={() => openStudentPreview(student, "grades")}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white"
                  >
                    View Grades
                  </button>

                  <button
                    onClick={() => openStudentPreview(student, "preview")}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-green-600 text-white"
                  >
                    Preview Report
                  </button>
                </div>
              </>
            )}
          />
        )}

        {activeTab === "violations" && (
          <ReportList
            title="Violation Reports"
            items={filteredViolations}
            empty="No violations found."
            render={(v) => (
              <>
                <p className="font-bold">{v.profiles?.full_name || "Unknown Student"}</p>
                <p className="text-sm text-red-600">{v.violation_type}</p>
                <p className="text-sm text-gray-500">{v.description}</p>
                <p className="text-xs text-gray-400">
                  {v.created_at ? new Date(v.created_at).toLocaleString() : "No date"}
                </p>
              </>
            )}
          />
        )}

        {activeTab === "courses" && (
          <ReportList
            title="Course Reports"
            items={filteredCourses}
            empty="No courses found."
            render={(course) => (
              <>
                <p className="font-bold">{course.course_name}</p>
                <p className="text-sm text-gray-500">
                  {course.course_code} - {course.section}
                </p>
                <p className="text-sm text-blue-600">
                  Professor: {course.profiles?.full_name || "No Professor"}
                </p>
                <p className="text-sm text-gray-500">
                  Joining Code: {course.joining_code}
                </p>
              </>
            )}
          />
        )}

        {activeTab === "exams" && (
          <ReportList
            title="Exam Reports"
            items={filteredExams}
            empty="No exams found."
            render={(exam) => (
              <>
                <p className="font-bold">{exam.title}</p>
                <p className="text-sm text-gray-500">
                  {exam.courses?.course_name || "No Course"} -{" "}
                  {exam.courses?.section || "No Section"}
                </p>
                <p className="text-sm text-blue-600">
                  Professor: {exam.profiles?.full_name || "Unknown Professor"}
                </p>
                <p className="text-sm text-gray-500">
                  Type: {exam.exam_type} • Period: {exam.period} • Status: {exam.status}
                </p>
              </>
            )}
          />
        )}

        {activeTab === "professors" && (
          <ReportList
            title="Professor Records"
            items={filteredProfiles.filter((p) => p.role === "professor")}
            empty="No professors found."
            render={(prof) => (
              <>
                <p className="font-bold">{prof.full_name || "Unnamed Professor"}</p>
                <p className="text-sm text-gray-500">
                  {prof.school_id || "No Employee Number"}
                </p>
                <p className="text-sm text-blue-600">
                  Status: {prof.is_active ? "Active" : "Deactivated"}
                </p>
              </>
            )}
          />
        )}

        {activeTab === "deans" && (
          <ReportList
            title="Dean Records"
            items={filteredProfiles.filter((p) => p.role === "dean")}
            empty="No dean accounts found."
            render={(dean) => (
              <>
                <p className="font-bold">{dean.full_name || "Unnamed Dean"}</p>
                <p className="text-sm text-gray-500">
                  {dean.school_id || "No Employee Number"}
                </p>
                <p className="text-sm text-blue-600">
                  Status: {dean.is_active ? "Active" : "Deactivated"}
                </p>
              </>
            )}
          />
        )}

        {activeTab === "attempts" && (
          <ReportList
            title="Exam Attempts"
            items={attempts}
            empty="No exam attempts found."
            render={(attempt) => (
              <>
                <p className="font-bold">
                  {attempt.profiles?.full_name || "Unknown Student"}
                </p>
                <p className="text-sm text-gray-500">
                  Exam: {attempt.exams?.title || "Unknown Exam"}
                </p>
                <p className="text-sm text-blue-600">
                  Score: {attempt.score ?? 0} • Attempt {attempt.attempt_number}
                </p>
                <p className="text-xs text-gray-400">
                  Submitted:{" "}
                  {attempt.submitted_at
                    ? new Date(attempt.submitted_at).toLocaleString()
                    : "N/A"}
                </p>
              </>
            )}
          />
        )}

        {activeTab === "grades" && (
          <ReportList
            title="Final Grades"
            items={grades}
            empty="No final grades found."
            render={(grade) => (
              <>
                <p className="font-bold">
                  {grade.profiles?.full_name || "Unknown Student"}
                </p>
                <p className="text-sm text-gray-500">
                  Exam: {grade.exams?.title || "Unknown Exam"}
                </p>
                <p className="text-sm text-blue-600">
                  Highest Score: {grade.highest_score}
                </p>
              </>
            )}
          />
        )}

        {activeTab === "logs" && (
          <ReportList
            title="System Logs"
            items={logs}
            empty="No system logs found."
            render={(log) => (
              <>
                <p className="font-bold">{log.action}</p>
                <p className="text-sm text-gray-500">
                  {log.description || "No description"}
                </p>
                <p className="text-sm text-blue-600">
                  User: {log.profiles?.full_name || "Unknown User"}
                </p>
                <p className="text-xs text-gray-400">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : "No date"}
                </p>
              </>
            )}
          />
        )}
      </div>

      {showPreviewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-2xl font-bold">{selectedStudent.full_name}</h3>
                <p className="text-gray-500">
                  {selectedStudent.school_id || "No School ID"}
                </p>
              </div>

              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 text-2xl"
              >
                ✕
              </button>
            </div>

            {previewType === "history" && (
              <StudentReportSection
                title="Account History Logs"
                items={logs.filter((log) => log.user_id === selectedStudent.id)}
                empty="No account logs found."
                render={(log) => (
                  <>
                    <p className="font-bold">{log.action}</p>
                    <p className="text-sm text-gray-500">{log.description}</p>
                    <p className="text-xs text-gray-400">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : "No date"}
                    </p>
                  </>
                )}
              />
            )}

            {previewType === "violations" && (
              <StudentReportSection
                title="Student Violations"
                items={violations.filter((v) => v.student_id === selectedStudent.id)}
                empty="No violations found."
                render={(v) => (
                  <>
                    <p className="font-bold text-red-600">{v.violation_type}</p>
                    <p className="text-sm text-gray-500">{v.description}</p>
                    <p className="text-xs text-gray-400">
                      {v.created_at
                        ? new Date(v.created_at).toLocaleString()
                        : "No date"}
                    </p>
                  </>
                )}
              />
            )}

            {previewType === "grades" && (
              <StudentReportSection
                title="Grades and Exam Scores"
                items={attempts.filter(
                  (attempt) => attempt.student_id === selectedStudent.id
                )}
                empty="No exam, quiz, or activity records found."
                render={(attempt) => (
                  <>
                    <p className="font-bold">{attempt.exams?.title}</p>
                    <p className="text-sm text-gray-500">
                      {attempt.exams?.exam_type} • {attempt.exams?.period}
                    </p>
                    <p className="text-sm text-blue-600">
                      Score: {attempt.score ?? 0}
                    </p>
                    <p className="text-xs text-gray-400">
                      Submitted:{" "}
                      {attempt.submitted_at
                        ? new Date(attempt.submitted_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </>
                )}
              />
            )}

            {previewType === "preview" && (
              <div>
                <button
                  onClick={() => window.print()}
                  className="mb-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold no-print"
                >
                  Print / Save as PDF
                </button>

                <StudentReportSection
                  title="Full Student Report Preview"
                  items={[
                    ...attempts.filter((a) => a.student_id === selectedStudent.id),
                    ...violations.filter((v) => v.student_id === selectedStudent.id),
                    ...logs.filter((l) => l.user_id === selectedStudent.id),
                  ]}
                  empty="No report data found."
                  render={(item) => (
                    <>
                      <p className="font-bold">
                        {item.exams?.title || item.violation_type || item.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.description || item.message || "Student record"}
                      </p>
                    </>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </AdminTopbarLayout>
  );
}

function ReportList({ title, items, empty, render }) {
  return (
    <section className="bg-white rounded-3xl shadow border p-5 print-card">
      <h3 className="text-xl font-bold mb-4">{title}</h3>

      {items.length === 0 ? (
        <p className="text-gray-500">{empty}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
            >
              {render(item)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StudentReportSection({ title, items, empty, render }) {
  return (
    <section className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
      <h4 className="text-xl font-bold mb-4">{title}</h4>

      {items.length === 0 ? (
        <p className="text-gray-500">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-gray-100"
            >
              {render(item)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminReportsPage;