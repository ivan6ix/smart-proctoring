import DashboardLayout from "../../layouts/DashboardLayout";

function JoinCoursePage() {
  return (
    <DashboardLayout role="Student">
      <h2 className="text-2xl font-bold mb-6">Join Course</h2>

      <div className="bg-white rounded-2xl shadow p-6 max-w-xl">
        <p className="text-gray-500 mb-5">
          Enter the joining code given by your professor or admin.
        </p>

        <form className="space-y-4">
          <input
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Enter joining code"
          />

          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold">
            Join Course
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default JoinCoursePage;