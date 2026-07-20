import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

import { renderToString } from "react-dom/server";
import { Dumbbell } from "lucide-react";

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
  try {
    const svgString = renderToString(<Dumbbell color="#FD5B0B" />);
    const encodedSvg = `data:image/svg+xml;base64,${btoa(svgString)}`;

    let favicon = document.getElementById("dynamic-favicon") as HTMLLinkElement;
    if (favicon) {
      favicon.remove();
    }

    favicon = document.createElement("link");
    favicon.id = "dynamic-favicon";
    favicon.rel = "icon";
    favicon.type = "image/svg+xml";
    favicon.href = encodedSvg;
    document.head.appendChild(favicon);
  } catch (e) {
    console.error("Error setting favicon", e);
  }

  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
