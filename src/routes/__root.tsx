import { NotificationCenter } from "@/components/NotificationCenter";
import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { isAxiosError } from "axios";

//import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  const isUnauthorized =
    error.message?.includes("401") ||
    error.message?.toUpperCase().includes("UNAUTHORIZED") ||
    (isAxiosError(error) && error.response?.status === 401);

  if (isUnauthorized) {
    return <UnauthorizedComponent />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl bg-gradient-card border border-border shadow-elevated p-8 text-center flex flex-col items-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-glow">
          <AlertTriangle className="h-7 w-7 text-primary" />
        </div>

        <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-foreground font-semibold">
          Un error ha ocurrido
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          No pudimos conectar con el servidor de PyrosFit. Por favor, intenta de nuevo.
        </p>

        {/* {import.meta.env.DEV && error.message && (
          <div className="mt-4 w-full text-left">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-mono">
              Logs de desarrollo:
            </p>
            <pre className="max-h-32 w-full overflow-auto rounded-xl bg-muted/60 border border-border p-3 font-mono text-xs text-destructive/90 backdrop-blur-sm">
              {error.message}
            </pre>
          </div>
        )} */}

        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          Reintentar conexión
        </button>
      </div>
    </div>
  );
}

function UnauthorizedComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">401</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Unauthorized</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PyrosFit App" },
      // { name: "description", content: "Lovable Generated Project" },
      // { name: "author", content: "Lovable" },
      // { property: "og:title", content: "Lovable App" },
      // { property: "og:description", content: "Lovable Generated Project" },
      // { property: "og:type", content: "website" },
      // { name: "twitter:card", content: "summary" },
      // { name: "twitter:site", content: "@Lovable" },
    ],
    // links: [
    //   {
    //     rel: "stylesheet",
    //     href: appCss,
    //   },
    // ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeadContent />
      {children}
      <Scripts />
    </>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <NotificationCenter />
    </>
  );
}
