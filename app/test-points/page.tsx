"use client";

import { useState, useEffect, useCallback } from "react";

interface Participant {
  position: number;
  username: string;
  points: string;
  points_numeric: number;
  reward: string;
}

interface ApiResponse {
  success: boolean;
  cached?: boolean;
  updated_at?: string;
  participants?: Participant[];
  error?: string;
}

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  return `${Math.floor(diff / 3600)} hours ago`;
}

export default function TestPointsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/test-points-leaderboard?id=230");
      const json: ApiResponse = await res.json();
      if (!json.success) {
        setError(json.error || "Unknown error");
        setData(null);
      } else {
        setData(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Acebet Points Leaderboard (Test)
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: "0.4rem 1rem",
            background: loading ? "#555" : "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>

        {data?.updated_at && (
          <span style={{ fontSize: "0.8rem", color: "#888" }}>
            Last updated: {timeAgo(data.updated_at)}
            {data.cached && " (cached)"}
          </span>
        )}
      </div>

      {loading && !data && (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>
          <div
            style={{
              display: "inline-block",
              width: 32,
              height: 32,
              border: "3px solid #333",
              borderTop: "3px solid #16a34a",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ marginTop: "1rem" }}>Scraping Acebet leaderboard... this may take up to 30 seconds.</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#1a0000",
            border: "1px solid #7f1d1d",
            borderRadius: 8,
            padding: "1rem",
            color: "#fca5a5",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {data?.participants && data.participants.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #333" }}>
                {["Rank", "Username", "Points", "Reward"].map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: col === "Rank" ? "center" : "left",
                      padding: "0.6rem 0.8rem",
                      color: "#aaa",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.participants.map((p) => (
                <tr
                  key={p.position}
                  style={{
                    borderBottom: "1px solid #222",
                    background: p.position <= 3 ? "rgba(22,163,74,0.06)" : "transparent",
                  }}
                >
                  <td style={{ textAlign: "center", padding: "0.6rem 0.8rem", fontWeight: 700, color: p.position === 1 ? "#fbbf24" : p.position === 2 ? "#9ca3af" : p.position === 3 ? "#cd7c3b" : "inherit" }}>
                    {p.position}
                  </td>
                  <td style={{ padding: "0.6rem 0.8rem", fontWeight: 500 }}>{p.username}</td>
                  <td style={{ padding: "0.6rem 0.8rem", color: "#86efac" }}>{p.points}</td>
                  <td style={{ padding: "0.6rem 0.8rem", color: "#4ade80", fontWeight: 600 }}>{p.reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#555" }}>
            {data.participants.length} participants found
          </p>
        </div>
      )}
    </main>
  );
}
