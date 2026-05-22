import { useState } from "react";
import AdminTopbarLayout from "../../layouts/AdminTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function CreateProfessorPage() {
  const [fullName, setFullName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateProfessor = async (e) => {
    e.preventDefault();

    setLoading(true);

    const generatedEmail =
      `${employeeNumber}@smartproctor.local`.toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: generatedEmail,
      password: temporaryPassword || "123456",
      options: {
        data: {
          role: "professor",
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
        role: "professor",
        auth_email: generatedEmail,
        is_active: true,
      });

      await supabase
        .from("system_logs")
        .insert({
          user_id: data.user.id,
          action: "Account Created",
          description: "Admin created this account.",
        });
    }

    alert(
      `Professor account created successfully.\nLogin ID: ${employeeNumber}\nDefault Auth Email: ${generatedEmail}`
    );

    setFullName("");
    setEmployeeNumber("");
    setTemporaryPassword("");
    setLoading(false);
  };

  return (
    <AdminTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Create Professor Account
        </h2>

        <p className="text-sm sm:text-base text-gray-500">
          Register a professor account using employee number and temporary
          password.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 p-5 sm:p-6 max-w-2xl">
        <form
          onSubmit={handleCreateProfessor}
          className="space-y-4"
        >
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-2xl px-4 py-3"
            placeholder="Full Name"
            required
          />

          <input
            value={employeeNumber}
            onChange={(e) =>
              setEmployeeNumber(e.target.value)
            }
            className="w-full border rounded-2xl px-4 py-3"
            placeholder="Employee Number"
            required
          />

          <input
            type="password"
            value={temporaryPassword}
            onChange={(e) =>
              setTemporaryPassword(e.target.value)
            }
            className="w-full border rounded-2xl px-4 py-3"
            placeholder="Temporary Password (default: 123456)"
          />

          <button
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Professor"}
          </button>
        </form>
      </div>
    </AdminTopbarLayout>
  );
}

export default CreateProfessorPage;