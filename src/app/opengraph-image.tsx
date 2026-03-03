import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sopia — Senior expertise where it matters. AI guidance everywhere else.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #0f172a 100%)",
          padding: "60px",
        }}
      >
        {/* Compass icon */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 40 40"
          fill="none"
          style={{ marginBottom: 24 }}
        >
          <circle cx="20" cy="20" r="17.5" stroke="#2AA5A0" strokeWidth="2" fill="none" />
          <line x1="20" y1="2.5" x2="20" y2="5.5" stroke="#2AA5A0" strokeWidth="1.5" />
          <line x1="37.5" y1="20" x2="34.5" y2="20" stroke="#2AA5A0" strokeWidth="1.5" />
          <line x1="20" y1="37.5" x2="20" y2="34.5" stroke="#2AA5A0" strokeWidth="1.5" />
          <line x1="2.5" y1="20" x2="5.5" y2="20" stroke="#2AA5A0" strokeWidth="1.5" />
          <path d="M20 6 L26 20 L20 34 L14 20 Z" fill="#2AA5A0" />
          <path d="M20 6 L26 20 L20 20 L14 20 Z" fill="#1D7A76" />
        </svg>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Sopia
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Senior expertise where it matters.
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          AI guidance everywhere else.
        </div>

        {/* Domain */}
        <div
          style={{
            fontSize: 18,
            color: "#2AA5A0",
            marginTop: 32,
            fontWeight: 500,
          }}
        >
          sopia.xyz
        </div>
      </div>
    ),
    { ...size }
  );
}
