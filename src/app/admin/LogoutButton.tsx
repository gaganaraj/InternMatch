
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function logout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      router.replace("/admin/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={logout}
        disabled={loading}
        className="rounded-xl bg-red-50 px-5 py-3 font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? "Signing out..." : "Sign Out"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
