import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultNotFoundComponent: NotFoundPage,
  });

  return router;
}

function NotFoundPage() {
  return (
    <>
      <section className="not-found-intro">
        <h1>Page not found</h1>
        <p>
          The page you asked for does not exist. It may have moved, or the
          address may be wrong.
        </p>
        <p>
          <a href="/">Back to the home page</a> or{" "}
          <a href="/writing">read the writing</a>.
        </p>
      </section>

      <section className="section" aria-label="Blob">
        <p>
          Since you are here anyway, this is me as a soft body. Grab it and
          throw it.
        </p>
        <BlobLazy />
      </section>
    </>
  );
}

import { lazy, Suspense } from "react";
const BlobPhysics = lazy(() => import("./components/BlobPhysics"));
function BlobLazy() {
  return (
    <Suspense fallback={null}>
      <BlobPhysics />
    </Suspense>
  );
}
