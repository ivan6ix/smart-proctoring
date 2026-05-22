import DashboardLayout from "../../layouts/DashboardLayout";
import { Link } from "react-router-dom";

function EnvironmentScanPage() {
  return (
    <DashboardLayout role="Student">
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-2">Environment Scan</h2>

        <p className="text-gray-500 mb-6">
          Please scan your surroundings before starting the exam.
        </p>

        <div className="bg-black rounded-2xl h-96 flex items-center justify-center text-white mb-6">
          Live Camera Scan Preview
        </div>

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-4 mb-6">
          Make sure there are no books, notes, gadgets, or other suspicious materials near you.
        </div>

        <div className="flex gap-4">
          <button className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold">
            Start Scan
          </button>

          <Link
            to="/student/take-exam"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Continue to Exam
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default EnvironmentScanPage;