import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen"; // Lovable genera esto automáticamente
import "./styles.css";

// Creamos la instancia del router usando el árbol de rutas generado
//const router = createRouter({ routeTree });

// Registro del router para seguridad de tipos (Typescript)
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const router = createRouter({ routeTree });

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
