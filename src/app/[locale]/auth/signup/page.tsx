import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  );
}
