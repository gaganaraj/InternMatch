
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login");
  }

  const [internships, students, applications, openInternships, pending] =
    await Promise.all([
      db.query("SELECT COUNT(*) FROM internships"),
      db.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      db.query("SELECT COUNT(*) FROM applications"),
      db.query("SELECT COUNT(*) FROM internships WHERE status = 'open'"),
      db.query("SELECT COUNT(*) FROM applications WHERE status IN ('submitted', 'under_review')"),
    ]);

  const stats = [
    {
      title: "Total Internships",
      count: internships.rows[0].count,
      icon: "💼",
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      title: "Open Internships",
      count: openInternships.rows[0].count,
      icon: "🟢",
      color: "bg-green-50 text-green-700",
    },
    {
      title: "Registered Students",
      count: students.rows[0].count,
      icon: "🎓",
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Total Applications",
      count: applications.rows[0].count,
      icon: "📋",
      color: "bg-purple-50 text-purple-700",
    },
  ];

  const modules = [
    {
      title: "Internship Management",
      description: "Add, edit, delete and manage internship opportunities.",
      icon: "💼",
      href: "/admin/internships",
      button: "Manage Internships",
    },
    {
      title: "Student Management",
      description: "View student profiles, education, skills and projects.",
      icon: "🎓",
      href: "/admin/students",
      button: "Manage Students",
    },
    {
      title: "Application Management",
      description: "Review applications and update candidate status.",
      icon: "📋",
      href: "/admin/applications",
      button: "Manage Applications",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">

        <header className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-indigo-600">
              INTERNMATCH ADMINISTRATION
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor and manage the InternMatch platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-white px-5 py-3 shadow-sm">
              <p className="text-xs text-slate-500">Logged in as</p>
              <p className="font-bold text-slate-900">{admin.email}</p>
            </div>

            <LogoutButton />
          </div>
        </header>

        {/* LIVE STATISTICS */}
        <section className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  {item.title}
                </p>
                <span className="text-2xl">{item.icon}</span>
              </div>

              <p className="mt-4 text-3xl font-black text-slate-900">
                {item.count}
              </p>
            </div>
          ))}
        </section>

        {/* PENDING APPLICATIONS */}
        <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div>
            <p className="font-bold text-amber-900">
              Applications awaiting review
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {pending.rows[0].count} applications are submitted or under review.
            </p>
          </div>

          <Link
            href="/admin/applications"
            className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-700"
          >
            Review Applications →
          </Link>
        </section>

        {/* MANAGEMENT MODULES */}
        <section className="mt-9">
          <h2 className="text-xl font-black text-slate-900">
            Management Modules
          </h2>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {modules.map((module) => (
              <div
                key={module.title}
                className="rounded-2xl bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-4xl">{module.icon}</div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  {module.title}
                </h3>

                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
                  {module.description}
                </p>

                <Link
                  href={module.href}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  {module.button} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-12 text-center text-xs text-slate-400">
          InternMatch · Admin Control Panel
        </footer>
      </div>
    </main>
  );
}
