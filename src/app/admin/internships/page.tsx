
"use client";

import { useCallback, useEffect, useState } from "react";

type Internship = {
  internship_id: number;
  title: string;
  company_name: string;
  description: string;
  location: string | null;
  work_mode: string;
  internship_type: string;
  stipend: string | number | null;
  eligibility_criteria: string | null;
  deadline: string | null;
  status: string;
};

const emptyForm = {
  title: "",
  company_name: "",
  description: "",
  location: "",
  work_mode: "onsite",
  internship_type: "paid",
  stipend: "",
  eligibility_criteria: "",
  deadline: "",
  status: "open",
};

export default function AdminInternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadInternships = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/internships", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load internships.");
      }

      setInternships(data.internships || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loading failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInternships();
  }, [loadInternships]);

  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function startAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setMessage("");
  }

  function startEdit(item: Internship) {
    setForm({
      title: item.title || "",
      company_name: item.company_name || "",
      description: item.description || "",
      location: item.location || "",
      work_mode: item.work_mode,
      internship_type: item.internship_type,
      stipend: item.stipend == null ? "" : String(item.stipend),
      eligibility_criteria: item.eligibility_criteria || "",
      deadline: item.deadline ? String(item.deadline).slice(0, 10) : "",
      status: item.status,
    });

    setEditingId(item.internship_id);
    setShowForm(true);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveInternship(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const url = editingId
        ? `/api/admin/internships/${editingId}`
        : "/api/admin/internships";

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          stipend: form.stipend === "" ? null : Number(form.stipend),
          deadline: form.deadline || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save internship.");
      }

      setMessage(
        editingId
          ? "Internship updated successfully!"
          : "Internship added successfully!"
      );

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadInternships();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteInternship(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this internship? This cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/internships/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete internship.");
      }

      setMessage("Internship deleted successfully!");
      await loadInternships();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const filteredInternships = internships.filter((item) => {
    const term = search.toLowerCase();

    return (
      item.title.toLowerCase().includes(term) ||
      item.company_name.toLowerCase().includes(term) ||
      (item.location || "").toLowerCase().includes(term) ||
      item.status.toLowerCase().includes(term)
    );
  });

  const openCount = internships.filter((i) => i.status === "open").length;
  const draftCount = internships.filter((i) => i.status === "draft").length;
  const closedCount = internships.filter((i) => i.status === "closed").length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <a href="/admin" className="text-sm font-semibold text-indigo-600">
              ← Back to Admin Dashboard
            </a>

            <h1 className="mt-3 text-3xl font-black text-slate-900">
              Internship Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create, manage and monitor internship opportunities.
            </p>
          </div>

          <button
            onClick={startAdd}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-indigo-700"
          >
            + Add Internship
          </button>
        </header>

        {/* SUMMARY CARDS */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Total Internships", count: internships.length, icon: "💼" },
            { title: "Open", count: openCount, icon: "🟢" },
            { title: "Drafts", count: draftCount, icon: "📝" },
            { title: "Closed", count: closedCount, icon: "🔒" },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  {card.title}
                </p>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">
                {card.count}
              </p>
            </div>
          ))}
        </section>

        {/* ALERTS */}
        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ADD / EDIT FORM */}
        {showForm && (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">
                {editingId ? "Edit Internship" : "Add New Internship"}
              </h2>

              <button
                onClick={() => setShowForm(false)}
                className="text-sm font-semibold text-slate-500 hover:text-red-600"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={saveInternship} className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Internship Title *
                  </label>
                  <input
                    required
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    placeholder="e.g. Software Developer Intern"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Company Name *
                  </label>
                  <input
                    required
                    name="company_name"
                    value={form.company_name}
                    onChange={updateField}
                    placeholder="Company name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    placeholder="Describe the internship..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Location
                  </label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={updateField}
                    placeholder="e.g. Bengaluru"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Work Mode *
                  </label>
                  <select
                    name="work_mode"
                    value={form.work_mode}
                    onChange={updateField}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    <option value="onsite">Onsite</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Internship Type *
                  </label>
                  <select
                    name="internship_type"
                    value={form.internship_type}
                    onChange={updateField}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="stipend">Stipend Based</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Stipend Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="stipend"
                    value={form.stipend}
                    onChange={updateField}
                    placeholder="e.g. 15000"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Eligibility Criteria
                  </label>
                  <textarea
                    rows={3}
                    name="eligibility_criteria"
                    value={form.eligibility_criteria}
                    onChange={updateField}
                    placeholder="Enter eligibility requirements..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={updateField}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-7 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Internship" : "Publish Internship"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="rounded-xl border border-slate-300 px-7 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* INTERNSHIP LIST */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900">
              All Internships
            </h2>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search internships..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 sm:w-72"
            />
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              Loading internships...
            </div>
          ) : filteredInternships.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl">📭</p>
              <p className="mt-4 font-semibold text-slate-700">
                No internships found.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Add an internship or try another search.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredInternships.map((item) => (
                <div
                  key={item.internship_id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-200"
                >
                  <div className="flex flex-col justify-between gap-5 md:flex-row">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {item.title}
                        </h3>

                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.status === "open"
                            ? "bg-green-100 text-green-700"
                            : item.status === "draft"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="mt-2 font-semibold text-indigo-600">
                        {item.company_name}
                      </p>

                      <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                        {item.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>📍 {item.location || "Location not specified"}</span>
                        <span>💻 {item.work_mode}</span>
                        <span>💰 {item.internship_type}</span>
                        <span>
                          💵 {item.stipend != null ? `₹${item.stipend}` : "Not specified"}
                        </span>
                        <span>
                          📅 {item.deadline ? String(item.deadline).slice(0, 10) : "No deadline"}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteInternship(item.internship_id)}
                        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          InternMatch · Internship Administration
        </p>
      </div>
    </main>
  );
}
