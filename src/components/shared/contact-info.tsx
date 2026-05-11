import { SOPIA_EMAIL, SOPIA_PHONE_DISPLAY, SOPIA_PHONE_TEL } from "@/lib/contact";

type Variant = "inline" | "stacked";

interface ContactInfoProps {
  variant?: Variant;
  className?: string;
}

export function ContactInfo({ variant = "inline", className = "" }: ContactInfoProps) {
  const wrapper =
    variant === "stacked"
      ? "flex flex-col gap-1.5"
      : "flex flex-wrap items-center gap-x-4 gap-y-1.5";

  return (
    <span className={`${wrapper} ${className}`.trim()}>
      <a
        href={`mailto:${SOPIA_EMAIL}`}
        className="inline-flex items-center gap-1.5 hover:text-foreground"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        {SOPIA_EMAIL}
      </a>
      <a
        href={`tel:${SOPIA_PHONE_TEL}`}
        className="inline-flex items-center gap-1.5 hover:text-foreground"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
        </svg>
        {SOPIA_PHONE_DISPLAY}
      </a>
    </span>
  );
}
