import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { supabase } from "../../lib/supabaseClient";

function SuspiciousActivityPage() {
  const { studentId } = useParams();
  const [violations, setViolations] = useState([]);

  const fetchViolations = async () => {
    const { data } = await supabase
      .from("violations")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    setViolations(data || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchViolations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout role="Professor">
      <h2 className="text-2xl font-bold mb-6">Suspicious Activity</h2>

      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        {violations.length === 0 ? (
          <p className="text-gray-500">No suspicious activity found.</p>
        ) : (
          violations.map((item) => (
            <div key={item.id} className="border rounded-xl p-4">
              <p className="font-bold">{item.violation_type}</p>
              <p>{item.description}</p>
              <p className="text-gray-500 text-sm">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

export default SuspiciousActivityPage;