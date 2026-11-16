
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Skill = {
  skill_id: number;
  skill_name: string;
  is_mandatory: boolean;
};

type Internship = {
  internship_id: number;
  title: string;
  company_name: string;
  description: string;
  location: string;
  work_mode: string;
  internship_type: string;
  stipend: number | string | null;
  eligibility_criteria: string;
  deadline: string | null;
  skills: Skill[];
};

type Match = {
  internship_id: number;
  title: string;
  company_name: string;
  description: string;
  location: string;
  work_mode: string;
  stipend: number | string | null;
  total_required_skills: number;
  matched_skill_count: number;
  skill_coverage_percent: number | string;
  required_skills: (Skill & { matched?: boolean })[];
  missing_skills: string[];
};

type Student = {
  user_id: number | string;
  full_name: string;
  education: string;
  career_goals: string;
};

type AIRecommendation = {
  internship_id: number;
  title: string;
  company_name: string;
  description: string;
  location: string;
  work_mode: string;
  internship_type: string;
  stipend: number | string | null;
  eligibility_criteria: string;
  deadline: string | null;
  cosine_distance: number;
  semantic_similarity: number;
};

type StudentApplication = {
  application_id: number | string;
  internship_id: number | string;
  status: string;
  applied_at: string;
  title: string;
  company_name: string;
};

type AIRecommendationResponse = {
  success: boolean;
  student_id: number;
  student_name: string;
  matching_method: string;
  model: string;
  note: string;
  results: AIRecommendation[];
};

export default function Home() {
  const router = useRouter();

  const [internships, setInternships] = useState<Internship[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [student, setStudent] = useState<Student | null>(null);

  // Student profile editing state
const [isEditingProfile, setIsEditingProfile] = useState(false);
const [profileForm, setProfileForm] = useState({
  full_name: "",
  education: "",
  career_goals: "",
});
const [profileSaving, setProfileSaving] = useState(false);
const [profileMessage, setProfileMessage] = useState("");
const [profileError, setProfileError] = useState("");

  const [studentId, setStudentId] = useState("");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selected, setSelected] = useState<Internship | null>(null);
  const [saved, setSaved] = useState<number[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedError, setSavedError] = useState("");

  // Application state
  const [appliedInternships, setAppliedInternships] = useState<number[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationRefreshing, setApplicationRefreshing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  const [error, setError] = useState("");
  const [matchError, setMatchError] = useState("");
  const [aiError, setAiError] = useState("");

  const [aiRecommendations, setAiRecommendations] =
    useState<AIRecommendation[]>([]);

  // Load the currently authenticated student
  useEffect(() => {
    let active = true;

    async function loadStudentSession() {
      try {
        const response = await fetch("/api/student/me", { cache: "no-store" });

        if (response.status === 401) {
          router.replace("/student/login");
          return;
        }

        const data = await response.json();
        if (!response.ok || !data.success || !data.student) {
          throw new Error(data.error || "Could not verify your student session.");
        }

        if (active) {
          setStudent(data.student);
          setStudentId(String(data.student.user_id));
        }
      } catch (err) {
        if (active) {
          setSessionError(
            err instanceof Error ? err.message : "Could not load your student session."
          );
        }
      } finally {
        if (active) setSessionLoading(false);
      }
    }

    loadStudentSession();
    return () => { active = false; };
  }, [router]);

  // Load internships from PostgreSQL
  useEffect(() => {
    async function loadInternships() {
      try {
        setLoading(true);

        const response = await fetch("/api/internships");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not load internships.");
        }

        setInternships(data.internships || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInternships();
  }, []);

  // Load exact skill-based matches
  useEffect(() => {
    async function loadMatches() {
      try {
        setMatchLoading(true);
        setMatchError("");

        const response = await fetch(
          `/api/students/${studentId}/matches`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || data.error || "Could not load matches.");
        }

        setStudent(data.student);
        setMatches(data.matches || []);
      } catch (err) {
        setStudent(null);
        setMatches([]);

        setMatchError(
          err instanceof Error ? err.message : "Could not load matches."
        );
      } finally {
        setMatchLoading(false);
      }
    }

    if (!studentId) return;
    loadMatches();
  }, [studentId]);

  // Load AI semantic recommendations through FastAPI and ChromaDB
  useEffect(() => {
    async function loadAIRecommendations() {
      try {
        setAiLoading(true);
        setAiError("");

        const response = await fetch(
          `/api/students/${studentId}/recommendations`,
          { cache: "no-store" }
        );

        const data: AIRecommendationResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error("Could not load AI recommendations.");
        }

        setAiRecommendations(data.results || []);
      } catch (err) {
        setAiRecommendations([]);

        setAiError(
          err instanceof Error
            ? err.message
            : "Could not load AI recommendations."
        );
      } finally {
        setAiLoading(false);
      }
    }

    if (!studentId) return;
    loadAIRecommendations();
  }, [studentId]);

  // Load saved internships from PostgreSQL whenever the selected student changes
  useEffect(() => {
    async function loadSavedInternships() {
      try {
        setSavedLoading(true);
        setSavedError("");

        const response = await fetch(
          `/api/students/${studentId}/saved-internships`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not load saved internships.");
        }

        setSaved(
          (data.saved_internships || []).map(
            (item: { internship_id: number | string }) =>
              Number(item.internship_id)
          )
        );
      } catch (err) {
        setSaved([]);
        setSavedError(
          err instanceof Error
            ? err.message
            : "Could not load saved internships."
        );
      } finally {
        setSavedLoading(false);
      }
    }

    if (!studentId) return;
    loadSavedInternships();
  }, [studentId]);

  // Load submitted applications whenever the selected student changes
  useEffect(() => {
    async function loadApplications() {
      try {
        setApplications([]);
        setAppliedInternships([]);
        setApplicationError("");
        setApplicationMessage("");

        const response = await fetch(
          `/api/students/${studentId}/applications`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not load applications.");
        }

        const applicationRows: StudentApplication[] = data.applications || [];
        setApplications(applicationRows);
        setAppliedInternships(
          applicationRows.map((item) => Number(item.internship_id))
        );
      } catch (err) {
        setApplications([]);
        setAppliedInternships([]);
        setApplicationError(
          err instanceof Error ? err.message : "Could not load applications."
        );
      }
    }

    if (!studentId) return;
    loadApplications();
  }, [studentId]);

  // Save updated student profile
const saveStudentProfile = async () => {
  try {
    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");

    const response = await fetch("/api/student/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileForm),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Could not update profile.");
    }

    setStudent(data.student);

    setProfileForm({
      full_name: data.student.full_name,
      education: data.student.education,
      career_goals: data.student.career_goals,
    });

    setIsEditingProfile(false);
    setProfileMessage("Your profile has been updated successfully.");
  } catch (err) {
    setProfileError(
      err instanceof Error ? err.message : "Could not update profile."
    );
  } finally {
    setProfileSaving(false);
  }
};

  // Refresh application statuses directly from PostgreSQL
  const refreshApplications = async () => {
    if (!studentId) return;
    try {
      setApplicationRefreshing(true);
      setApplicationError("");

      const response = await fetch(
        `/api/students/${studentId}/applications`,
        { cache: "no-store" }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not refresh applications.");
      }

      const rows: StudentApplication[] = data.applications || [];
      setApplications(rows);
      setAppliedInternships(rows.map((item) => Number(item.internship_id)));
    } catch (err) {
      setApplicationError(
        err instanceof Error ? err.message : "Could not refresh applications."
      );
    } finally {
      setApplicationRefreshing(false);
    }
  };

  // Submit an application through the PostgreSQL API
  const applyForInternship = async () => {
    if (!studentId || !selected || applicationLoading) return;

    const internshipId = selected.internship_id;

    if (appliedInternships.includes(internshipId)) {
      setApplicationMessage("You have already applied for this internship.");
      setApplicationError("");
      return;
    }

    try {
      setApplicationLoading(true);
      setApplicationError("");
      setApplicationMessage("");

      const response = await fetch(
        `/api/students/${studentId}/applications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ internship_id: internshipId }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 409) {
          setAppliedInternships((previous) =>
            previous.includes(internshipId)
              ? previous
              : [...previous, internshipId]
          );
          setApplicationMessage(
            data.error || "You have already applied for this internship."
          );
          return;
        }

        throw new Error(data.error || "Could not submit your application.");
      }

      setAppliedInternships((previous) =>
        previous.includes(internshipId)
          ? previous
          : [...previous, internshipId]
      );
      setApplicationMessage(
        data.message || "Application submitted successfully."
      );

      const refreshedResponse = await fetch(
        `/api/students/${studentId}/applications`,
        { cache: "no-store" }
      );
      const refreshedData = await refreshedResponse.json();
      if (refreshedResponse.ok && refreshedData.success) {
        const applicationRows: StudentApplication[] =
          refreshedData.applications || [];
        setApplications(applicationRows);
      }
    } catch (err) {
      setApplicationError(
        err instanceof Error
          ? err.message
          : "Could not submit your application."
      );
    } finally {
      setApplicationLoading(false);
    }
  };

  // Save or remove an internship using the PostgreSQL API
  const toggleSaved = async (internshipId: number) => {
    if (!studentId || savingId !== null) return;

    const isAlreadySaved = saved.includes(internshipId);

    try {
      setSavingId(internshipId);
      setSavedError("");

      const response = await fetch(
        `/api/students/${studentId}/saved-internships${
          isAlreadySaved ? `?internship_id=${internshipId}` : ""
        }`,
        {
          method: isAlreadySaved ? "DELETE" : "POST",
          headers: isAlreadySaved
            ? undefined
            : { "Content-Type": "application/json" },
          body: isAlreadySaved
            ? undefined
            : JSON.stringify({ internship_id: internshipId }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not update saved internships.");
      }

      setSaved((previous) =>
        isAlreadySaved
          ? previous.filter((id) => id !== internshipId)
          : previous.includes(internshipId)
            ? previous
            : [...previous, internshipId]
      );
    } catch (err) {
      setSavedError(
        err instanceof Error
          ? err.message
          : "Could not update saved internships."
      );
    } finally {
      setSavingId(null);
    }
  };

  // Log out the current student
  const handleLogout = async () => {
    if (logoutLoading) return;

    try {
      setLogoutLoading(true);
      const response = await fetch("/api/student/logout", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not log out.");
      }
      router.replace("/student/login");
      router.refresh();
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : "Could not log out.");
      setLogoutLoading(false);
    }
  };

  // Work-mode filters
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(internships.map((item) => item.work_mode))
      ),
    ],
    [internships]
  );

  // Search and filter internships
  const filteredInternships = useMemo(() => {
    const query = search.toLowerCase().trim();

    return internships.filter((item) => {
      const searchableText = [
        item.title,
        item.company_name,
        item.description,
        item.location,
        ...item.skills.map((skill) => skill.skill_name),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);
      const matchesCategory =
        category === "All" || item.work_mode === category;

      return matchesSearch && matchesCategory;
    });
  }, [internships, search, category]);

  // Format stipend
  const formatStipend = (value: number | string | null) => {
    if (value === null || value === undefined || value === "") {
      return "Stipend not specified";
    }

    return `₹${Number(value).toLocaleString("en-IN")}/month`;
  };

  const findInternship = (id: number) =>
    internships.find((item) => item.internship_id === id);

  // Open internship details from either recommendation or listing
  const openInternship = (id: number) => {
    const internship = findInternship(id);

    if (internship) {
      setSelected(internship);
    }
  };

  if (sessionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p className="rounded-2xl bg-white px-6 py-5 text-slate-600 shadow-sm">
          Verifying your student account...
        </p>
      </main>
    );
  }

  if (!studentId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Unable to open dashboard</h1>
          <p className="mt-3 text-sm text-red-700">{sessionError || "Redirecting to student login..."}</p>
          <a href="/student/login" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white">Go to student login</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* NAVIGATION */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a
            href="#"
            className="text-2xl font-black tracking-tight text-indigo-700"
          >
            InternMatch<span className="text-indigo-400">.</span>
          </a>

          <span className="hidden text-sm text-slate-500 sm:block">
            Discover opportunities that fit your skills
          </span>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden text-sm font-semibold text-slate-700 md:inline">
              Welcome, {student?.full_name || "Student"}
            </span>
            <a
              href="#my-applications"
              className="rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              My Applications
            </a>
            <a
              href="#internships"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Explore internships
            </a>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {logoutLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
              Your next opportunity starts here
            </p>

            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              Find internships that match your potential.
            </h1>

            <p className="mt-5 max-w-xl leading-7 text-indigo-100">
              Explore opportunities, compare required skills, and discover
              where your current skills align with internship requirements.
            </p>

            <a
              href="#matches"
              className="mt-7 inline-block rounded-xl bg-white px-6 py-3 font-bold text-indigo-800 hover:bg-indigo-50"
            >
              View my matches →
            </a>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-7 shadow-2xl backdrop-blur-sm">
            <p className="text-sm font-semibold text-indigo-100">
              YOUR CAREER JOURNEY
            </p>

            <div className="mt-6 space-y-5">
              {[
                ["01", "Build your profile", "Showcase your skills and projects."],
                ["02", "Explore opportunities", "Discover internships and their requirements."],
                ["03", "Understand your fit", "See matching skills and skills to develop."],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 font-bold">
                    {number}
                  </div>

                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm text-indigo-100">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MATCHING DASHBOARD */}
      <section id="matches" className="mx-auto max-w-7xl px-5 py-14">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Personalized dashboard
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Internship matches
            </h2>

            <p className="mt-2 text-slate-600">
              Explore AI recommendations and compare your skills with internship requirements.
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Logged-in student
            </p>
            <p className="mt-1 font-semibold text-indigo-700">
              {student?.full_name || "Student"}
            </p>
          </div>
        </div>

        
        {/* STUDENT PROFILE */}
{matchLoading ? (
  <p className="mt-8 rounded-2xl bg-white p-6 text-slate-600">
    Loading student profile...
  </p>
) : matchError ? (
  <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
    {matchError}
  </p>
) : (
  student && (
    <div className="mt-7 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            STUDENT PROFILE
          </p>
          <h3 className="mt-2 text-xl font-bold">
            {student.full_name}
          </h3>
        </div>

        {!isEditingProfile && (
          <button
            type="button"
            onClick={() => {
              setProfileForm({
                full_name: student.full_name,
                education: student.education,
                career_goals: student.career_goals,
              });
              setProfileMessage("");
              setProfileError("");
              setIsEditingProfile(true);
            }}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Edit Profile
          </button>
        )}
      </div>

      {isEditingProfile ? (
        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Full Name
            </label>
            <input
              value={profileForm.full_name}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  full_name: e.target.value,
                })
              }
              maxLength={150}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Education
            </label>
            <input
              value={profileForm.education}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  education: e.target.value,
                })
              }
              maxLength={200}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Career Goals
            </label>
            <textarea
              value={profileForm.career_goals}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  career_goals: e.target.value,
                })
              }
              maxLength={1000}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveStudentProfile}
              disabled={profileSaving}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {profileSaving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(false);
                setProfileError("");
              }}
              disabled={profileSaving}
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>

          {profileError && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {profileError}
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600">
            {student.education}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            <strong>Career goals:</strong> {student.career_goals}
          </p>
        </>
      )}

      {profileMessage && (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          {profileMessage}
        </p>
      )}
    </div>
  )
)}
        {/* AI RECOMMENDATIONS */}
        <div className="mt-10">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-950 to-violet-800 p-6 text-white sm:p-8">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-200">
              Powered by Artificial Intelligence
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              AI-Powered Internship Recommendations
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-indigo-100">
              Recommendations are generated using Sentence Transformers,
              semantic embeddings, and ChromaDB cosine similarity.
              The system compares the student's profile with internship
              descriptions to identify relevant opportunities.
            </p>
          </div>

          {aiLoading ? (
            <p className="mt-5 rounded-2xl bg-white p-6 text-slate-600">
              Generating AI recommendations...
            </p>
          ) : aiError ? (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              {aiError}
            </p>
          ) : aiRecommendations.length > 0 ? (
            <>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {aiRecommendations.map((item, index) => {
                  const percentage = Math.max(
                    0,
                    Math.min(100, Number(item.semantic_similarity) || 0)
                  );

                  return (
                    <article
                      key={item.internship_id}
                      className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                            AI RANK #{index + 1}
                          </span>

                          <h3 className="mt-4 text-xl font-bold">
                            {item.title}
                          </h3>

                          <p className="mt-1 font-medium text-indigo-700">
                            {item.company_name}
                          </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
                          <p className="text-2xl font-black text-emerald-700">
                            {Number(item.semantic_similarity).toFixed(2)}%
                          </p>
                          <p className="text-xs font-semibold text-emerald-700">
                            Semantic relevance
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
                        <span className="rounded-lg bg-slate-100 px-3 py-2">
                          {item.location}
                        </span>

                        <span className="rounded-lg bg-slate-100 px-3 py-2">
                          {item.work_mode}
                        </span>

                        <span className="rounded-lg bg-slate-100 px-3 py-2">
                          {formatStipend(item.stipend)}
                        </span>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="font-semibold">
                            Semantic relevance score
                          </span>

                          <span className="font-bold text-indigo-700">
                            {percentage.toFixed(2)}%
                          </span>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <p className="mt-4 text-xs leading-5 text-slate-500">
                        This score represents semantic relevance based on
                        cosine similarity. It is not a probability of
                        selection or a guarantee of eligibility.
                      </p>

                      <button
                        onClick={() => openInternship(item.internship_id)}
                        className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700"
                      >
                        View internship details
                      </button>
                    </article>
                  );
                })}
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Matching method: Sentence Transformers + ChromaDB cosine
                similarity. Model: all-MiniLM-L6-v2.
              </p>
            </>
          ) : (
            <p className="mt-5 rounded-2xl bg-white p-6 text-slate-600">
              No AI recommendations are available for this student.
            </p>
          )}
        </div>

        {/* EXACT SKILL MATCHING */}
        <div className="mt-14">
          <h2 className="text-2xl font-black">
            Exact Skill-Based Matching
          </h2>

          <p className="mt-2 text-slate-600">
            Compare the student's recorded skills with the required skills
            for each internship.
          </p>

          {matchLoading ? (
            <p className="mt-6 rounded-2xl bg-white p-6 text-slate-600">
              Loading skill matches...
            </p>
          ) : matchError ? (
            <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              {matchError}
            </p>
          ) : (
            <>
              <div className="mt-7 grid gap-5 md:grid-cols-2">
                {matches.map((match) => {
                  const percentage = Number(match.skill_coverage_percent);
                  const internship = findInternship(match.internship_id);

                  return (
                    <article
                      key={match.internship_id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-bold">
                            {match.title}
                          </h3>

                          <p className="mt-1 font-medium text-indigo-700">
                            {match.company_name}
                          </p>
                        </div>

                        <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700">
                          {Number.isFinite(percentage)
                            ? percentage.toFixed(0)
                            : "0"}% skill coverage
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {match.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
                        <span className="rounded-lg bg-slate-100 px-3 py-2">
                          {match.location}
                        </span>

                        <span className="rounded-lg bg-slate-100 px-3 py-2">
                          {match.work_mode}
                        </span>

                        <span className="rounded-lg bg-slate-100 px-3 py-2">
                          {formatStipend(match.stipend)}
                        </span>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="font-semibold">
                            Required skills matched
                          </span>

                          <span className="text-slate-500">
                            {match.matched_skill_count}/
                            {match.total_required_skills}
                          </span>
                        </div>

                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                          role="progressbar"
                          aria-valuenow={Math.max(
                            0,
                            Math.min(100, percentage || 0)
                          )}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${match.title} skill coverage`}
                        >
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, percentage || 0)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="mb-2 text-sm font-bold text-slate-800">
                          Skills you have
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {match.required_skills
                            .filter((skill) => skill.matched)
                            .map((skill) => (
                              <span
                                key={skill.skill_id}
                                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
                              >
                                ✓ {skill.skill_name}
                              </span>
                            ))}

                          {match.matched_skill_count === 0 && (
                            <span className="text-sm text-slate-500">
                              No exact required-skill matches yet.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 text-sm font-bold text-slate-800">
                          Skills to develop
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {match.missing_skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
                            >
                              + {skill}
                            </span>
                          ))}

                          {match.missing_skills.length === 0 && (
                            <span className="text-sm text-emerald-700">
                              All listed required skills are matched.
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mt-5 text-xs leading-5 text-slate-500">
                        This percentage measures exact required-skill
                        coverage. It is not a probability of selection or
                        semantic similarity.
                      </p>

                      <button
                        onClick={() =>
                          internship && setSelected(internship)
                        }
                        disabled={!internship}
                        className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        View internship details
                      </button>
                    </article>
                  );
                })}
              </div>

              {matches.length === 0 && (
                <p className="mt-6 rounded-2xl bg-white p-6 text-slate-600">
                  No open internship matches are available for this profile.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* MY APPLICATIONS */}
      <section id="my-applications" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                Application tracker
              </p>
              <h2 className="mt-2 text-3xl font-black">My Applications</h2>
              <p className="mt-2 text-slate-600">
                Track the internships you have applied for.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex w-fit rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700">
                {applications.length} application(s)
              </span>
              <button
                type="button"
                onClick={refreshApplications}
                disabled={applicationRefreshing}
                className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60"
              >
                {applicationRefreshing ? "Refreshing..." : "↻ Refresh status"}
              </button>
            </div>
          </div>

          {applicationError ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {applicationError}
            </p>
          ) : applications.length > 0 ? (
            <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-4 divide-y divide-slate-100">
                {applications.map((application) => (
                  <article
                    key={application.application_id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {application.title}
                      </h3>
                      <p className="mt-1 font-medium text-indigo-700">
                        {application.company_name}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Applied on{" "}
                        {new Date(application.applied_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        {" · "}Application ID: {application.application_id}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${
                          ({
                            submitted: "bg-slate-100 text-slate-700",
                            under_review: "bg-amber-100 text-amber-800",
                            shortlisted: "bg-blue-100 text-blue-800",
                            accepted: "bg-emerald-100 text-emerald-800",
                            rejected: "bg-red-100 text-red-800",
                            withdrawn: "bg-gray-100 text-gray-700",
                          } as Record<string, string>)[application.status] ||
                          "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {application.status.replaceAll("_", " ")}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <p className="text-lg font-bold text-slate-800">
                No applications yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Once you apply for an internship, it will appear here.
              </p>
              <a
                href="#internships"
                className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Explore internships
              </a>
            </div>
          )}
        </div>
      </section>

      {/* AVAILABLE INTERNSHIPS */}
      <section id="internships" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Explore opportunities
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Available internships
            </h2>

            <p className="mt-2 text-slate-600">
              Search live listings retrieved from your PostgreSQL database.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, company, location, or skill..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by work mode"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All work modes" : item}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="mt-8 text-slate-600">
              Loading internships...
            </p>
          ) : error ? (
            <p className="mt-8 rounded-xl bg-red-50 p-5 text-red-700">
              {error}
            </p>
          ) : (
            <>
              <p className="mt-5 text-sm text-slate-500">
                {filteredInternships.length} internship(s) found
                {savedLoading ? " · Loading saved list..." : ""}
              </p>
              {savedError && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {savedError}
                </p>
              )}

              <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredInternships.map((item) => (
                  <article
                    key={item.internship_id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                        {item.work_mode}
                      </span>

                      <button
                        onClick={() => toggleSaved(item.internship_id)}
                        disabled={
                          savingId === item.internship_id || savedLoading
                        }
                        aria-pressed={saved.includes(item.internship_id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                      >
                        {savingId === item.internship_id
                          ? "Saving..."
                          : saved.includes(item.internship_id)
                            ? "♥ Saved"
                            : "♡ Save"}
                      </button>
                    </div>

                    <h3 className="mt-5 text-xl font-bold">
                      {item.title}
                    </h3>

                    <p className="mt-1 font-medium text-indigo-700">
                      {item.company_name}
                    </p>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-2">
                        {item.location}
                      </span>

                      <span className="rounded-lg bg-slate-100 px-2.5 py-2">
                        {formatStipend(item.stipend)}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="mb-2 text-sm font-bold">
                        Required skills
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {item.skills.map((skill) => (
                          <span
                            key={skill.skill_id}
                            className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700"
                          >
                            {skill.skill_name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto pt-6">
                      <button
                        onClick={() => setSelected(item)}
                        className="w-full rounded-xl border border-indigo-200 px-4 py-3 font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        View details
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {filteredInternships.length === 0 && (
                <p className="mt-8 rounded-xl bg-slate-50 p-6 text-slate-600">
                  No internships match your search. Try another keyword
                  or work mode.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-indigo-700">InternMatch.</p>
          <p>Skill-based internship discovery and matching.</p>
        </div>
      </footer>

      {/* INTERNSHIP DETAILS MODAL */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="internship-modal-title"
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                  Internship details
                </p>

                <h2
                  id="internship-modal-title"
                  className="mt-2 text-2xl font-black"
                >
                  {selected.title}
                </h2>

                <p className="mt-1 font-semibold text-indigo-700">
                  {selected.company_name}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                aria-label="Close details"
                className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {[
                selected.location,
                selected.work_mode,
                selected.internship_type,
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="font-bold">
                About this opportunity
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                {selected.description}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="font-bold">
                Eligibility criteria
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                {selected.eligibility_criteria ||
                  "No eligibility details provided."}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="font-bold">
                Required skills
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {selected.skills.map((skill) => (
                  <span
                    key={skill.skill_id}
                    className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800"
                  >
                    {skill.skill_name}
                    {skill.is_mandatory
                      ? " · Required"
                      : " · Preferred"}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Monthly stipend
              </p>

              <p className="mt-1 text-xl font-black">
                {formatStipend(selected.stipend)}
              </p>

              <p className="mt-3 text-sm text-slate-600">
                Deadline:{" "}
                {selected.deadline
                  ? new Date(selected.deadline).toLocaleDateString("en-IN")
                  : "Not specified"}
              </p>
            </div>

            <button
              onClick={applyForInternship}
              disabled={
                applicationLoading ||
                appliedInternships.includes(selected.internship_id)
              }
              className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {applicationLoading
                ? "Submitting application..."
                : appliedInternships.includes(selected.internship_id)
                  ? "Already applied"
                  : "Apply now"}
            </button>

            {applicationMessage && (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-800">
                {applicationMessage}
              </p>
            )}

            {applicationError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
                {applicationError}
              </p>
            )}

            <p className="mt-3 text-center text-xs text-slate-500">
              Your application is submitted to the InternMatch database.
              You can apply only once for each internship.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
