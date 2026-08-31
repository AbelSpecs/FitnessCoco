import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/clients/$studentId")({
  component: () => <Outlet />,
});