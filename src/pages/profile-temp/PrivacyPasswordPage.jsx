import DashboardLayout from "../../layouts/DashboardLayout";

function PrivacyPasswordPage() {
  return (
    <DashboardLayout role="Profile">
      <h2 className="text-2xl font-bold mb-6">
        Privacy / Password
      </h2>

      <div className="bg-white rounded-2xl shadow p-6 max-w-2xl">
        <form className="space-y-4">
          <input
            type="password"
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Current Password"
          />

          <input
            type="password"
            className="w-full border rounded-xl px-4 py-3"
            placeholder="New Password"
          />

          <input
            type="password"
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Confirm New Password"
          />

          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold">
            Update Password
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default PrivacyPasswordPage;