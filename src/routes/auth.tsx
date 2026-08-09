import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy sign-in URL — kept so old links keep working. */
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/student-login", replace: true });
  },
  component: () => null,
});
