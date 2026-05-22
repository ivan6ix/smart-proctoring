import DashboardLayout from "../../layouts/DashboardLayout";

function NotificationSettingsPage() {
  return (
    <DashboardLayout role="Profile">
      <h2 className="text-2xl font-bold mb-6">
        Notification Settings
      </h2>

      <div className="bg-white rounded-2xl shadow p-6 max-w-2xl space-y-5">
        <label className="flex items-center justify-between border rounded-xl p-4">
          <span>Exam Published Notifications</span>
          <input type="checkbox" className="w-5 h-5" defaultChecked />
        </label>

        <label className="flex items-center justify-between border rounded-xl p-4">
          <span>Grade Released Notifications</span>
          <input type="checkbox" className="w-5 h-5" defaultChecked />
        </label>

        <label className="flex items-center justify-between border rounded-xl p-4">
          <span>Suspicious Activity Alerts</span>
          <input type="checkbox" className="w-5 h-5" />
        </label>

        <label className="flex items-center justify-between border rounded-xl p-4">
          <span>Course Announcements</span>
          <input type="checkbox" className="w-5 h-5" defaultChecked />
        </label>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold">
          Save Notification Settings
        </button>
      </div>
    </DashboardLayout>
  );
}

export default NotificationSettingsPage;