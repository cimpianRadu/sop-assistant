"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ro">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          gap: "1rem",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Something went wrong
        </h2>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "0.375rem",
            background: "#2AA5A0",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
