import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: RedirectComponent,
});

function RedirectComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/arena", replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#090d14] flex items-center justify-center text-amber-400 font-bold text-sm">
      Launching CapitalGuard Arena...
    </div>
  );
}

export default RedirectComponent;