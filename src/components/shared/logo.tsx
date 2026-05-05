/**
 * Sopia compass-diamond mark — pure SVG, server-renderable.
 * Use the wordmark next to it for the full logo (e.g. {<Logo />} {appName}).
 */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <circle cx="20" cy="20" r="17.5" stroke="#2AA5A0" strokeWidth="2" fill="none" />
      <line x1="20" y1="2.5" x2="20" y2="5.5" stroke="#2AA5A0" strokeWidth="1.5" />
      <line x1="37.5" y1="20" x2="34.5" y2="20" stroke="#2AA5A0" strokeWidth="1.5" />
      <line x1="20" y1="37.5" x2="20" y2="34.5" stroke="#2AA5A0" strokeWidth="1.5" />
      <line x1="2.5" y1="20" x2="5.5" y2="20" stroke="#2AA5A0" strokeWidth="1.5" />
      <path d="M20 6 L26 20 L20 34 L14 20 Z" fill="#2AA5A0" />
      <path d="M20 6 L26 20 L20 20 L14 20 Z" fill="#1D7A76" />
    </svg>
  );
}
