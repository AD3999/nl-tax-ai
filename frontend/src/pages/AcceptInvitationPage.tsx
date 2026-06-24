import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiBase } from "../api/client";

type State = "loading" | "success" | "error";

export default function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("error");
      setErrorMsg("No invitation token found in the link.");
      return;
    }

    fetch(`${apiBase}/portal/invitations/accept/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { detail?: string };
          throw new Error(body.detail ?? "Failed to accept invitation.");
        }
        setState("success");
        setTimeout(() => navigate("/login?next=/client"), 3000);
      })
      .catch((err: unknown) => {
        setState("error");
        setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      });
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        {state === "loading" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Accepting your invitation...</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-semibold">Invitation accepted!</h1>
            <p className="text-muted-foreground">
              You have been linked to your accountant. Redirecting you to log in...
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-semibold">Invitation failed</h1>
            <p className="mb-4 text-muted-foreground">{errorMsg}</p>
            <button
              onClick={() => navigate("/login")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
