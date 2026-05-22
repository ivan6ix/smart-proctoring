import { useEffect, useState } from "react";
import AdminTopbarLayout from "../../layouts/AdminTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function CreateDeanPage() {
  const [fullName, setFullName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [deans, setDeans] = useState([]);

  const fetchDeans = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "dean")
      .order("created_at", { ascending: false });

    if (!error) {
      setDeans(data || []);
    }
  };

  const handleCreateDean = async (e) => {
    e.preventDefault();
    setLoading(true);

    const generatedEmail =
      `${employeeNumber}@smartproctor.local`.toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: generatedEmail,
      password: temporaryPassword || "123456",
      options: {
        data: {
          role: "dean",
          full_name: fullName,
          school_id: employeeNumber,
          auth_email: generatedEmail,
        },
      },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        school_id: employeeNumber,
        role: "dean",
        auth_email: generatedEmail,
        is_active: true,
      });

      await supabase.from("system_logs").insert({
        user_id: data.user.id,
        action: "Account Created",
        description: "Admin created this dean account.",
      });
    }

    alert(
      `Dean account created successfully.\nLogin ID: ${employeeNumber}\nDefault Auth Email: ${generatedEmail}`
    );

    setFullName("");
    setEmployeeNumber("");
    setTemporaryPassword("");
    setLoading(false);
    fetchDeans();
  };

  const handleDeactivateDean = async (dean) => {
    const confirmAction = window.confirm(
      `Deactivate ${dean.full_name}'s account?`
    );

    if (!confirmAction) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", dean.id);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from("system_logs").insert({
      user_id: dean.id,
      action: "Account Deactivated",
      description: "Dean account was deactivated by admin.",
    });

    alert("Dean account deactivated.");
    fetchDeans();
  };

  const handleReactivateDean = async (dean) => {
    const confirmAction = window.confirm(
      `Reactivate ${dean.full_name}'s account?`
    );

    if (!confirmAction) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: true })
      .eq("id", dean.id);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from("system_logs").insert({
      user_id: dean.id,
      action: "Account Reactivated",
      description: "Dean account was reactivated by admin.",
    });

    alert("Dean account reactivated.");
    fetchDeans();
  };

  const handleResetPassword = async (dean) => {
    alert(
      `Password reset must be done through Supabase Auth Admin or Forgot Password email.\n\nDean: ${dean.full_name}\nAuth Email: ${dean.auth_email || "No auth email"}`
    );
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDeans();
  }, []);

  const activeDeans = deans.filter((dean) => dean.is_active !== false);
  const deactivatedDeans = deans.filter((dean) => dean.is_active === false);

  return (
    <AdminTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Create Dean Account
        </h2>

        <p className="text-sm sm:text-base text-gray-500">
          Register, deactivate, reactivate, and manage dean accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
          <h3 className="text-xl font-bold mb-4">New Dean Account</h3>

          <form onSubmit={handleCreateDean} className="space-y-4">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Full Name"
              required
            />

            <input
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Employee Number"
              required
            />

            <input
              type="password"
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Temporary Password (default: 123456)"
            />

            <button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Dean"}
            </button>
          </form>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
            <h3 className="text-xl font-bold mb-4">Active Deans</h3>

            {activeDeans.length === 0 ? (
              <div className="border border-dashed rounded-3xl p-6 text-center text-gray-500">
                No active dean accounts.
              </div>
            ) : (
              <div className="space-y-3">
                {activeDeans.map((dean) => (
                  <div
                    key={dean.id}
                    className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-gray-900">
                        {dean.full_name}
                      </p>

                      <p className="text-sm text-gray-500">
                        Employee No: {dean.school_id || "N/A"}
                      </p>

                      <p className="text-sm text-gray-500">
                        Auth Email: {dean.auth_email || "N/A"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleResetPassword(dean)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                      >
                        Reset Password
                      </button>

                      <button
                        onClick={() => handleDeactivateDean(dean)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6">
            <h3 className="text-xl font-bold mb-4">Deactivated Deans</h3>

            {deactivatedDeans.length === 0 ? (
              <div className="border border-dashed rounded-3xl p-6 text-center text-gray-500">
                No deactivated dean accounts.
              </div>
            ) : (
              <div className="space-y-3">
                {deactivatedDeans.map((dean) => (
                  <div
                    key={dean.id}
                    className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-gray-900">
                        {dean.full_name}
                      </p>

                      <p className="text-sm text-gray-500">
                        Employee No: {dean.school_id || "N/A"}
                      </p>

                      <p className="text-sm text-gray-500">
                        Auth Email: {dean.auth_email || "N/A"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleReactivateDean(dean)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                    >
                      Reactivate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminTopbarLayout>
  );
}

export default CreateDeanPage;