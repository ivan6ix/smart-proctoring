import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import AdminTopbarLayout from "../../layouts/AdminTopbarLayout";
import { supabase } from "../../lib/supabaseClient";

function ManageAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (!error) {
      setAccounts(data || []);
    }
  };

  const toggleAccountStatus = async (account) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !account.is_active })
      .eq("id", account.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchAccounts();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter((account) => {
    const keyword = search.toLowerCase();
    const matchesSearch =
      account.full_name?.toLowerCase().includes(keyword) ||
      account.school_id?.toLowerCase().includes(keyword) ||
      account.role?.toLowerCase().includes(keyword);

    const matchesRole =
      roleFilter === "all" || account.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const activeAccounts = filteredAccounts.filter(
    (account) => account.is_active
  );

  const deactivatedAccounts = filteredAccounts.filter(
    (account) => !account.is_active
  );

  return (
    <AdminTopbarLayout>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Manage Accounts
        </h2>

        <p className="text-sm sm:text-base text-gray-500">
          Activate or deactivate professor, dean, and student accounts.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, school ID, or role..."
              className="w-full border rounded-2xl pl-12 pr-4 py-3"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="professor">Professor</option>
            <option value="student">Student</option>
            <option value="dean">Dean</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900">
            Active Accounts
          </h3>

          <span className="text-sm text-gray-500">
            {activeAccounts.length} active
          </span>
        </div>

        {activeAccounts.length === 0 ? (
          <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
            No active accounts found.
          </div>
        ) : (
          <div className="space-y-3">
            {activeAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-gray-50 rounded-3xl p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-700" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {account.full_name || "Unnamed User"}
                      </p>

                      <p className="text-sm text-gray-500 truncate">
                        {account.school_id || "No ID"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 capitalize">
                      {account.role || "user"}
                    </span>

                    <button
                      onClick={() => toggleAccountStatus(account)}
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
            Deactivated Accounts
          </h3>

          <span className="text-sm text-gray-500">
            {deactivatedAccounts.length} deactivated
          </span>
        </div>

        {deactivatedAccounts.length === 0 ? (
          <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
            No deactivated accounts.
          </div>
        ) : (
          <div className="space-y-3">
            {deactivatedAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-red-50 rounded-3xl p-4 border border-red-100"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-red-700" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {account.full_name || "Unnamed User"}
                      </p>

                      <p className="text-sm text-gray-500 truncate">
                        {account.school_id || "No ID"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white text-gray-700 capitalize">
                      {account.role || "user"}
                    </span>

                    <button
                      onClick={() => toggleAccountStatus(account)}
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

export default ManageAccountsPage;