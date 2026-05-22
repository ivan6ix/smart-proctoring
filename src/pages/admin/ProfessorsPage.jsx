import { useEffect, useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import AdminTopbarLayout from "../../layouts/AdminTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function ProfessorsPage() {
  const [professors, setProfessors] = useState([]);
  const [filteredProfessors, setFilteredProfessors] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [fullName, setFullName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fetchProfessors = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "professor")
      .order("full_name", { ascending: true });

    if (!error) {
      setProfessors(data || []);
      setFilteredProfessors(data || []);
    }
  };

  const toggleProfessorStatus = async (professor) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !professor.is_active })
      .eq("id", professor.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchProfessors();
  };

  const handleResetPassword = async (professor) => {
    const confirmReset = window.confirm(
      `Reset password of ${professor.full_name} to 123456?`
    );

    if (!confirmReset) return;

    const { error } = await supabase.auth.admin.updateUserById(professor.id, {
      password: "123456",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password reset successfully. Default password is now 123456");
  };

  const handleCreateProfessor = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          school_id: employeeNumber,
          role: "professor",
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Professor account created.");

    setFullName("");
    setEmployeeNumber("");
    setEmail("");
    setPassword("");
    setShowModal(false);
    fetchProfessors();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfessors();
  }, []);

  useEffect(() => {
    const filtered = professors.filter((professor) => {
      const name = professor.full_name || "";
      const schoolId = professor.school_id || "";

      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        schoolId.toLowerCase().includes(search.toLowerCase())
      );
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredProfessors(filtered);
  }, [search, professors]);

  const activeProfessors = filteredProfessors.filter(
    (professor) => professor.is_active
  );

  const deactivatedProfessors = filteredProfessors.filter(
    (professor) => !professor.is_active
  );

  return (
    <AdminTopbarLayout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Professors
          </h2>

          <p className="text-sm sm:text-base text-gray-500">
            Manage professor accounts and activation status.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Create Professor
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search professor name or employee number..."
            className="w-full border rounded-2xl pl-12 pr-4 py-3"
          />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-2xl font-bold">Create Professor</h3>
                <p className="text-sm text-gray-500">
                  Register a new professor account.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProfessor} className="space-y-4">
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
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Email Address"
                required
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Temporary Password"
                required
              />

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold">
                Create Professor
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900">
            Active Professors
          </h3>

          <span className="text-sm text-gray-500">
            {activeProfessors.length} active
          </span>
        </div>

        {activeProfessors.length === 0 ? (
          <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
            No active professors found.
          </div>
        ) : (
          <div className="space-y-3">
            {activeProfessors.map((professor) => (
              <div
                key={professor.id}
                className="bg-gray-50 rounded-3xl p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-700" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {professor.full_name}
                      </h3>

                      <p className="text-sm text-gray-500 truncate">
                        {professor.school_id || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResetPassword(professor)}
                      className="px-3 py-1 rounded-lg text-xs text-white font-semibold bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                    >
                      Reset Password
                    </button>

                    <button
                      onClick={() => toggleProfessorStatus(professor)}
                      className="px-3 py-1 rounded-lg text-xs text-white font-semibold bg-red-600 hover:bg-red-700 whitespace-nowrap"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-3xl shadow border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900">
            Deactivated Professors
          </h3>

          <span className="text-sm text-gray-500">
            {deactivatedProfessors.length} deactivated
          </span>
        </div>

        {deactivatedProfessors.length === 0 ? (
          <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
            No deactivated accounts.
          </div>
        ) : (
          <div className="space-y-3">
            {deactivatedProfessors.map((professor) => (
              <div
                key={professor.id}
                className="bg-red-50 rounded-3xl p-4 border border-red-100"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-red-700" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {professor.full_name}
                      </p>

                      <p className="text-sm text-gray-500 truncate">
                        {professor.school_id || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResetPassword(professor)}
                      className="px-3 py-1 rounded-lg text-xs text-white font-semibold bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                    >
                      Reset Password
                    </button>

                    <button
                      onClick={() => toggleProfessorStatus(professor)}
                      className="px-3 py-1 rounded-lg text-xs text-white font-semibold bg-green-600 hover:bg-green-700 whitespace-nowrap"
                    >
                      Activate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminTopbarLayout>
  );
}

export default ProfessorsPage;