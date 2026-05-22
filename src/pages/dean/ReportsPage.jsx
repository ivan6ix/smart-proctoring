import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  FileText,
  Printer,
  Search,
  Users,
} from "lucide-react";
import DeanTopbarLayout from "../../layouts/DeanTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function ReportsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [openStudentMenu, setOpenStudentMenu] = useState(null);

  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [violations, setViolations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);

  const fetchReports = async () => {
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

    const { data: studentsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("full_name", { ascending: true });

    const { data: professorsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "professor")
      .order("full_name", { ascending: true });

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

    const { data: violationsData } = await supabase
      .from("violations")
      .select(`
        *,
        profiles:student_id (
          full_name,
          school_id
        )
      `)
      .order("created_at", { ascending: false });

    setExams(examsData || []);
    setStudents(studentsData || []);
    setProfessors(professorsData || []);
    setCourses(coursesData || []);
    setViolations(violationsData || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports();
  }, []);

  const filteredExams = exams.filter((exam) => {
    const key = search.toLowerCase();

    return (
      exam.title?.toLowerCase().includes(key) ||
      exam.exam_type?.toLowerCase().includes(key) ||
      exam.period?.toLowerCase().includes(key) ||
      exam.courses?.course_name?.toLowerCase().includes(key) ||
      exam.courses?.section?.toLowerCase().includes(key) ||
      exam.profiles?.full_name?.toLowerCase().includes(key)
    );
  });

  const filteredViolations = violations.filter((v) => {
    const key = search.toLowerCase();

    return (
      v.violation_type?.toLowerCase().includes(key) ||
      v.description?.toLowerCase().includes(key) ||
      v.profiles?.full_name?.toLowerCase().includes(key) ||
      v.profiles?.school_id?.toLowerCase().includes(key)
    );
  });

  const filteredCourses = courses.filter((course) => {
    const key = search.toLowerCase();

    return (
      course.course_name?.toLowerCase().includes(key) ||
      course.course_code?.toLowerCase().includes(key) ||
      course.section?.toLowerCase().includes(key) ||
      course.profiles?.full_name?.toLowerCase().includes(key)
    );
  });

  const filteredStudents = students.filter((student) => {
    const key = search.toLowerCase();

    return (
      student.full_name?.toLowerCase().includes(key) ||
      student.school_id?.toLowerCase().includes(key)
    );
  });

  const filteredProfessors = professors.filter((professor) => {
    const key = search.toLowerCase();

    return (
      professor.full_name?.toLowerCase().includes(key) ||
      professor.school_id?.toLowerCase().includes(key)
    );
  });

  return (
    <DeanTopbarLayout>
      <style>
        {`
          @media print {
            button, input, .no-print {
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

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Reports
          </h2>

          <p className="text-gray-500">
            View academic integrity, exam, course, professor, and student reports.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <SummaryCard icon={<FileText />} title="Total Exams" value={exams.length} />
        <SummaryCard icon={<Users />} title="Students" value={students.length} />
        <SummaryCard icon={<AlertTriangle />} title="Violations" value={violations.length} danger />
        <SummaryCard icon={<BookOpen />} title="Courses" value={courses.length} />
        <SummaryCard icon={<Users />} title="Professors" value={professors.length} />
      </div>

      <div className="no-print bg-white rounded-3xl shadow border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-2xl pl-12 pr-4 py-3"
            placeholder="Search student, professor, course, section, violation, or exam..."
          />
        </div>
      </div>

      <div className="no-print flex flex-wrap gap-2 mb-6">
        {[
          ["overview", "Overview"],
          ["exams", "Exams"],
          ["violations", "Violations"],
          ["courses", "Courses"],
          ["students", "Students"],
          ["professors", "Professors"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setOpenStudentMenu(null);
            }}
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
          <ReportList
            title="Recent Exams"
            items={filteredExams.slice(0, 8)}
            empty="No exams found."
            render={(exam) => (
              <>
                <p className="font-bold">{exam.title}</p>
                <p className="text-sm text-gray-500">
                  {exam.courses?.course_name || "No Course"} -{" "}
                  {exam.courses?.section || "No Section"}
                </p>
                <p className="text-sm text-blue-600">
                  Prof: {exam.profiles?.full_name || "Unknown Professor"}
                </p>
              </>
            )}
          />

          <ReportList
            title="Recent Violations"
            items={filteredViolations.slice(0, 8)}
            empty="No violations found."
            render={(v) => (
              <>
                <p className="font-bold">
                  {v.profiles?.full_name || "Unknown Student"}
                </p>
                <p className="text-sm text-red-600">{v.violation_type}</p>
                <p className="text-sm text-gray-500">{v.description}</p>
              </>
            )}
          />
        </div>
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
                {exam.exam_type} • {exam.period} • {exam.status}
              </p>
              <p className="text-sm text-gray-500">
                {exam.courses?.course_name || "No Course"} -{" "}
                {exam.courses?.section || "No Section"}
              </p>
              <p className="text-sm text-blue-600">
                Prof: {exam.profiles?.full_name || "Unknown Professor"}
              </p>
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
              <p className="font-bold">
                {v.profiles?.full_name || "Unknown Student"}
              </p>
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
                Prof: {course.profiles?.full_name || "No professor"}
              </p>
              <p className="text-sm text-gray-500">
                Code: {course.joining_code}
              </p>
            </>
          )}
        />
      )}

      {activeTab === "students" && (
        <ReportList
          title="Student Reports"
          items={filteredStudents}
          empty="No students found."
          render={(student) => (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {student.full_name || "Unnamed Student"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {student.school_id || "No School ID"}
                  </p>

                  <p className="text-sm text-blue-600">
                    Status: {student.is_active ? "Active" : "Deactivated"}
                  </p>
                </div>

                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenStudentMenu(
                        openStudentMenu === student.id ? null : student.id
                      )
                    }
                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    ▼
                  </button>

                  {openStudentMenu === student.id && (
                    <div className="absolute right-0 top-10 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      <button
                        onClick={() =>
                          navigate(`/dean/reports/student/${student.id}`)
                        }
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium"
                      >
                        View History Logs
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        />
      )}

      {activeTab === "professors" && (
        <ReportList
          title="Professor Reports"
          items={filteredProfessors}
          empty="No professors found."
          render={(professor) => (
            <>
              <p className="font-bold">
                {professor.full_name || "Unnamed Professor"}
              </p>
              <p className="text-sm text-gray-500">
                {professor.school_id || "No Employee Number"}
              </p>
              <p className="text-sm text-blue-600">
                Status: {professor.is_active ? "Active" : "Deactivated"}
              </p>
            </>
          )}
        />
      )}
    </DeanTopbarLayout>
  );
}

function SummaryCard({ icon, title, value, danger }) {
  return (
    <div className="bg-white rounded-3xl shadow border border-gray-100 p-5 print-card">
      <div className={`mb-3 ${danger ? "text-red-600" : "text-blue-600"}`}>
        {icon}
      </div>
      <p className="text-gray-500">{title}</p>
      <h3 className={`text-3xl font-bold ${danger ? "text-red-600" : ""}`}>
        {value}
      </h3>
    </div>
  );
}

function ReportList({ title, items, empty, render }) {
  return (
    <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 print-card">
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

export default ReportsPage;