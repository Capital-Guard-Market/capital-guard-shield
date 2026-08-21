import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldHalf } from "lucide-react";
import { useSession } from "@/lib/session";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 41.1 44 36 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export function LoginScreen() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const enter = (u: Parameters<ReturnType<typeof useSession>["signIn"]>[0]) => {
    signIn(u);
    void navigate({ to: "/" });
  };
  const [phone, setPhone] = useState("");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <ShieldHalf className="shield-pulse mx-auto size-20 text-primary" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">CapitalGuard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Practice With Consequences — Discipline-First Trading Simulator
        </p>

        <button
          onClick={() =>
            enter({
              name: "Sai Deekshit",
              email: "sai.deekshit@gmail.com",
              avatar: "SD",
              method: "google",
            })
          }
          className="mt-10 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3.5 text-sm font-semibold transition-colors hover:bg-accent"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-xl border border-border bg-card px-3">
            <span className="num shrink-0 pr-2 text-sm text-muted-foreground">+91</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              aria-label="Mobile number"
              placeholder="Enter mobile number"
              className="num w-full min-w-0 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() =>
              enter({
                name: phone ? `+91 ${phone}` : "Guest Trader",
                email: phone ? `+91${phone}` : "guest@capitalguard.app",
                avatar: "CG",
                method: "phone",
              })
            }
            className="shrink-0 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Send OTP
          </button>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-warning">
          ⚠️ By continuing, you agree this is a virtual trading simulator — no real money is ever
          placed.
        </p>
      </div>
    </div>
  );
}
