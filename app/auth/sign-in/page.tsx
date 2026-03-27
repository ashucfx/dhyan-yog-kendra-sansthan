import { Suspense } from "react";
import { AuthForm } from "../auth-form";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="loading-state">Loading...</div>}>
      <AuthForm mode="sign-in" />
    </Suspense>
  );
}
