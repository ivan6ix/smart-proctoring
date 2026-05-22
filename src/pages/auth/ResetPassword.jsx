import { Link } from "react-router-dom";

function ResetPassword() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2">
          Reset Password
        </h1>

        <p className="text-gray-500 text-center mb-8">
          Enter your new password.
        </p>

        <form className="space-y-5">
          <input
            type="password"
            placeholder="New Password"
            className="w-full border rounded-xl px-4 py-3"
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            className="w-full border rounded-xl px-4 py-3"
          />

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">
            Update Password
          </button>
        </form>

        <p className="text-center text-sm mt-5">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;