import { useEffect, useState } from "react";
import { Archive, Search } from "lucide-react";
import AdminTopbarLayout from "../../layouts/AdminTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [archivedCourses, setArchivedCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [search, setSearch] = useState("");
  const [archiveSearch, setArchiveSearch] = useState("");
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [section, setSection] = useState("");
  const [joiningCode, setJoiningCode] = useState("");
  const [professorId, setProfessorId] = useState("");

  const generateJoiningCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const fetchProfessors = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "professor")
    .eq("is_active", true)
    .or("is_archived.eq.false,is_archived.is.null")
    .order("full_name", { ascending: true });

  if (error) {
    alert(error.message);
    return;
  }

  setProfessors(data || []);
};

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        profiles:professor_id (
          full_name
        )
      `)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (!error) setCourses(data || []);
  };

  const fetchArchivedCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        profiles:professor_id (
          full_name
        )
      `)
      .eq("is_archived", true)
      .order("created_at", { ascending: false });

    if (!error) setArchivedCourses(data || []);
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();

    if (!joiningCode) {
      alert("Please generate a joining code first.");
      return;
    }

    if (!professorId) {
      alert("Please assign a professor.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("courses").insert({
      course_name: courseName,
      course_code: courseCode,
      section,
      joining_code: joiningCode,
      professor_id: professorId,
      created_by: userData.user.id,
      is_archived: false,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Course added successfully.");

    setCourseName("");
    setCourseCode("");
    setSection("");
    setProfessorId("");
    setJoiningCode(generateJoiningCode());

    fetchCourses();
  };

  const handleArchiveCourse = async (course) => {
    const confirmArchive = window.confirm(
      `Archive ${course.course_name}?`
    );

    if (!confirmArchive) return;

    const { error } = await supabase
      .from("courses")
      .update({ is_archived: true })
      .eq("id", course.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Course archived successfully.");
    fetchCourses();
    fetchArchivedCourses();
  };

  const handleRestoreCourse = async (course) => {
    const confirmRestore = window.confirm(
      `Restore ${course.course_name}?`
    );

    if (!confirmRestore) return;

    const { error } = await supabase
      .from("courses")
      .update({ is_archived: false })
      .eq("id", course.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Course restored successfully.");
    fetchCourses();
    fetchArchivedCourses();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourses();
    fetchProfessors();
    fetchArchivedCourses();
    setJoiningCode(generateJoiningCode());
  }, []);

  const filteredCourses = courses.filter((course) => {
    const keyword = search.toLowerCase();

    return (
      course.course_name?.toLowerCase().includes(keyword) ||
      course.course_code?.toLowerCase().includes(keyword) ||
      course.section?.toLowerCase().includes(keyword) ||
      course.profiles?.full_name?.toLowerCase().includes(keyword) ||
      course.joining_code?.toLowerCase().includes(keyword)
    );
  });

  const filteredArchivedCourses = archivedCourses.filter((course) => {
    const keyword = archiveSearch.toLowerCase();

    return (
      course.course_name?.toLowerCase().includes(keyword) ||
      course.course_code?.toLowerCase().includes(keyword) ||
      course.section?.toLowerCase().includes(keyword) ||
      course.profiles?.full_name?.toLowerCase().includes(keyword) ||
      course.joining_code?.toLowerCase().includes(keyword)
    );
  });

  return (
    <AdminTopbarLayout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Courses
          </h2>

          <p className="text-sm sm:text-base text-gray-500">
            Create courses, assign professors, manage joining codes, and archive old courses.
          </p>
        </div>

        <button
          onClick={() => {
            fetchArchivedCourses();
            setShowArchivedModal(true);
          }}
          className="w-full lg:w-auto bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
        >
          <Archive className="w-5 h-5" />
          Archived Courses
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6 mb-6">
        <h3 className="text-xl font-bold mb-5">Add Course</h3>

        <form
          onSubmit={handleAddCourse}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="border rounded-2xl px-4 py-3"
            placeholder="Course Name"
            required
          />

          <input
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="border rounded-2xl px-4 py-3"
            placeholder="Course Code"
            required
          />

          <input
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="border rounded-2xl px-4 py-3"
            placeholder="Section"
            required
          />

          <select
            value={professorId}
            onChange={(e) => setProfessorId(e.target.value)}
            className="border rounded-2xl px-4 py-3"
            required
          >
            <option value="">Assign Professor</option>
            {professors.map((professor) => (
              <option key={professor.id} value={professor.id}>
                {professor.full_name || "Unnamed Professor"}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              value={joiningCode}
              readOnly
              className="border rounded-2xl px-4 py-3 w-full bg-gray-100"
              placeholder="Joining Code"
            />

            <button
              type="button"
              onClick={() => setJoiningCode(generateJoiningCode())}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 rounded-2xl font-semibold"
            >
              Generate
            </button>
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold">
            Add Course
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course, section, professor, or joining code..."
            className="w-full border rounded-2xl pl-12 pr-4 py-3"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Section</th>
                <th className="px-6 py-4">Professor</th>
                <th className="px-6 py-4">Joining Code</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-gray-500" colSpan="6">
                    No active courses found.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="border-b">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {course.course_name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {course.course_code}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {course.section}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {course.profiles?.full_name || "No professor"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl font-bold">
                        {course.joining_code}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleArchiveCourse(course)}
                          className="px-3 py-1.5 rounded-lg text-xs text-white font-semibold bg-red-600 hover:bg-red-700"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden p-4 space-y-4">
          {filteredCourses.length === 0 ? (
            <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
              No active courses found.
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-gray-50 rounded-3xl p-5 border border-gray-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {course.course_name}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {course.course_code} - {course.section}
                    </p>
                  </div>

                  <span className="bg-blue-50 text-blue-700 px-3 py-2 rounded-2xl text-sm font-bold">
                    {course.joining_code}
                  </span>
                </div>

                <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500">Assigned Professor</p>
                  <p className="font-semibold text-gray-900">
                    {course.profiles?.full_name || "No professor"}
                  </p>
                </div>

                <button
                  onClick={() => handleArchiveCourse(course)}
                  className="mt-4 px-4 py-2 rounded-xl text-sm text-white font-semibold bg-red-600 hover:bg-red-700"
                >
                  Archive
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showArchivedModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-[95vw] h-[90vh] overflow-y-auto p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Archived Courses
                </h3>

                <p className="text-gray-500">
                  Search archived courses by course name, code, section, professor, or joining code.
                </p>
              </div>

              <button
                onClick={() => setShowArchivedModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-2xl font-semibold"
              >
                Close
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

              <input
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="w-full border rounded-2xl pl-12 pr-4 py-3"
                placeholder="Search archived course, code, section, professor..."
              />
            </div>

            {filteredArchivedCourses.length === 0 ? (
              <div className="border border-dashed rounded-3xl p-10 text-center text-gray-500">
                No archived courses found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredArchivedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-gray-50 rounded-3xl p-5 border border-gray-100"
                  >
                    <h4 className="font-bold text-lg text-gray-900">
                      {course.course_name}
                    </h4>

                    <p className="text-gray-500 mt-1">
                      {course.course_code} - {course.section}
                    </p>

                    <p className="text-sm text-gray-500 mt-3">
                      Professor: {course.profiles?.full_name || "No professor"}
                    </p>

                    <p className="mt-3 inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-sm font-bold">
                      Code: {course.joining_code}
                    </p>

                    <button
                      onClick={() => handleRestoreCourse(course)}
                      className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-2xl font-semibold"
                    >
                      Restore Course
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminTopbarLayout>
  );
}

export default CoursesPage;