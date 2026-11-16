
"use client";

import { useCallback, useEffect, useState } from "react";

type Skill = {
  skill_id: number;
  skill_name: string;
  category: string | null;
  proficiency: number;
};

type Project = {
  project_id: number;
  project_title: string;
  description: string | null;
  project_url: string | null;
};

type Application = {
  application_id: number;
  internship_id: number;
  internship_title: string | null;
  company_name: string | null;
  status: string;
  applied_at: string;
};

type Student = {
  user_id: number;
  email: string;
  created_at: string;
  full_name: string | null;
  education: string | null;
  graduation_year: number | null;
  career_goals: string | null;
  profile_text: string | null;
  skills: Skill[];
  projects: Project[];
  applications: Application[];
  application_count: number;
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/students", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load students.");
      }

      setStudents(data.students || []);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = students.filter((student) => {
    const term = search.toLowerCase();

    return (
      (student.full_name || "").toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      (student.education || "").toLowerCase().includes(term)
    );
  });

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
              Student Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View student profiles, skills, projects and applications.
            </p>
          </div>

          <button
            onClick={loadStudents}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
          >
            ↻ Refresh
          </button>
        </header>

        {/* SUMMARY */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total Registered Students
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              {students.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total Applications
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              {students.reduce(
                (total, student) =>
                  total + Number(student.application_count),
                0
              )}
            </p>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* STUDENT LIST */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900">
              Registered Students
            </h2>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or education..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 sm:w-80"
            />
          </div>

          {loading ? (
            <p className="py-16 text-center text-slate-500">
              Loading student records...
            </p>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl">🎓</p>
              <p className="mt-3 font-semibold text-slate-700">
                No students found.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="px-4 py-4">Student</th>
                    <th className="px-4 py-4">Education</th>
                    <th className="px-4 py-4">Graduation</th>
                    <th className="px-4 py-4">Skills</th>
                    <th className="px-4 py-4">Applications</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.user_id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-5">
                        <p className="font-bold text-slate-900">
                          {student.full_name || "Name not provided"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {student.email}
                        </p>
                      </td>

                      <td className="px-4 py-5 text-sm text-slate-600">
                        {student.education || "Not specified"}
                      </td>

                      <td className="px-4 py-5 text-sm text-slate-600">
                        {student.graduation_year || "—"}
                      </td>

                      <td className="px-4 py-5 text-sm text-slate-600">
                        {student.skills?.length || 0}
                      </td>

                      <td className="px-4 py-5">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
                          {student.application_count}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <button
                          onClick={() => setSelected(student)}
                          className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* STUDENT PROFILE MODAL */}
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">
                    STUDENT PROFILE
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    {selected.full_name || "Student"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selected.email}
                  </p>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg bg-slate-100 px-3 py-2 font-bold text-slate-600 hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    EDUCATION
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selected.education || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    GRADUATION YEAR
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selected.graduation_year || "Not provided"}
                  </p>
                </div>
              </div>

              <section className="mt-7">
                <h3 className="font-bold text-slate-900">Career Goals</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selected.career_goals || "No career goals provided."}
                </p>
              </section>

              <section className="mt-7">
                <h3 className="font-bold text-slate-900">
                  Skills ({selected.skills?.length || 0})
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.skills?.length ? (
                    selected.skills.map((skill) => (
                      <span
                        key={skill.skill_id}
                        className="rounded-full bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700"
                      >
                        {skill.skill_name} · {skill.proficiency}/5
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No skills added.
                    </p>
                  )}
                </div>
              </section>

              <section className="mt-7">
                <h3 className="font-bold text-slate-900">
                  Projects ({selected.projects?.length || 0})
                </h3>

                <div className="mt-3 space-y-3">
                  {selected.projects?.length ? (
                    selected.projects.map((project) => (
                      <div
                        key={project.project_id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <p className="font-semibold text-slate-900">
                          {project.project_title}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          {project.description || "No description provided."}
                        </p>

                        {project.project_url && (
                          <a
                            href={project.project_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-sm font-semibold text-indigo-600"
                          >
                            View Project →
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No projects added.
                    </p>
                  )}
                </div>
              </section>

              <section className="mt-7">
                <h3 className="font-bold text-slate-900">
                  Application History ({selected.applications?.length || 0})
                </h3>

                <div className="mt-3 space-y-3">
                  {selected.applications?.length ? (
                    selected.applications.map((application) => (
                      <div
                        key={application.application_id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {application.internship_title || "Internship"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {application.company_name || "Company not available"}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                          {application.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No applications submitted yet.
                    </p>
                  )}
                </div>
              </section>

              <button
                onClick={() => setSelected(null)}
                className="mt-8 w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          InternMatch · Student Administration
        </p>
      </div>
    </main>
  );
}
