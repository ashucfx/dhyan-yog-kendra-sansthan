import { Suspense } from "react";
import { AuthForm } from "../auth-form";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="loading-state">Loading...</div>}>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
