
"use client";

import { useCallback, useEffect, useState } from "react";

type Application = {
  application_id: number;
  student_id: number;
  internship_id: number;
  status: string;
  applied_at: string;
  email: string;
  full_name: string | null;
  education: string | null;
  graduation_year: number | null;
  internship_title: string;
  company_name: string;
  location: string | null;
  work_mode: string;
  stipend: number | string | null;
};

const statuses = [
  "submitted",
  "under_review",
  "shortlisted",
  "rejected",
  "accepted",
  "withdrawn",
];

function statusStyle(status: string) {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-700";
    case "shortlisted":
      return "bg-blue-100 text-blue-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "under_review":
      return "bg-amber-100 text-amber-700";
    case "withdrawn":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-indigo-100 text-indigo-700";
  }
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/applications", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load applications.");
      }

      setApplications(data.applications || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loading failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function updateStatus(id: number, status: string) {
    try {
      setUpdatingId(id);
      setError("");
      setMessage("");

      const response = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update status.");
      }

      setMessage("Application status updated successfully.");
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = applications.filter((item) => {
    const term = search.toLowerCase();

    const matchesSearch =
      (item.full_name || "").toLowerCase().includes(term) ||
      item.email.toLowerCase().includes(term) ||
      item.internship_title.toLowerCase().includes(term) ||
      item.company_name.toLowerCase().includes(term);

    const matchesFilter =
      filter === "all" || item.status === filter;

    return matchesSearch && matchesFilter;
  });

  const countFor = (status: string) =>
    applications.filter((item) => item.status === status).length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <a
              href="/admin"
              className="text-sm font-semibold text-indigo-600"
            >
              ← Back to Admin Dashboard
            </a>

            <h1 className="mt-3 text-3xl font-black text-slate-900">
              Application Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Review student applications and manage their status.
            </p>
          </div>

          <button
            onClick={loadApplications}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
          >
            ↻ Refresh
          </button>
        </header>

        {/* SUMMARY */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Total Applications", count: applications.length },
            { title: "Under Review", count: countFor("under_review") },
            { title: "Shortlisted", count: countFor("shortlisted") },
            { title: "Accepted", count: countFor("accepted") },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-500">
                {item.title}
              </p>
              <p className="mt-3 text-3xl font-black text-slate-900">
                {item.count}
              </p>
            </div>
          ))}
        </section>

        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* APPLICATION LIST */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-xl font-black text-slate-900">
              All Applications
            </h2>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or internship..."
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
              >
                <option value="all">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-16 text-center text-slate-500">
              Loading applications...
            </p>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl">📋</p>
              <p className="mt-3 font-semibold text-slate-700">
                No applications found.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filtered.map((item) => (
                <article
                  key={item.application_id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {item.full_name || "Student"}
                        </h3>

                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(item.status)}`}>
                          {item.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.email}
                      </p>

                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="font-bold text-indigo-700">
                          {item.internship_title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.company_name}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>📍 {item.location || "Not specified"}</span>
                          <span>💻 {item.work_mode}</span>
                          <span>🎓 {item.education || "Education not provided"}</span>
                          <span>📅 Graduation: {item.graduation_year || "—"}</span>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        Applied: {new Date(item.applied_at).toLocaleString()}
                        {" · "}
                        Application ID: {item.application_id}
                      </p>
                    </div>

                    <div className="w-full lg:w-56">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Update Application Status
                      </label>

                      <select
                        value={item.status}
                        disabled={updatingId === item.application_id}
                        onChange={(e) =>
                          updateStatus(item.application_id, e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>

                      {updatingId === item.application_id && (
                        <p className="mt-2 text-xs text-indigo-600">
                          Updating...
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          InternMatch · Application Administration
        </p>
      </div>
    </main>
  );
}
