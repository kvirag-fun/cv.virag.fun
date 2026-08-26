import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Base path the site is served from. "/" for user/organization GitHub Pages
// sites and custom domains; set VITE_BASEPATH="/<repo>" at build time for
// project pages served from a sub-path.
const basepath = (import.meta.env["VITE_BASEPATH"] ?? "/").replace(/\/$/, "") || "/";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    basepath,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
