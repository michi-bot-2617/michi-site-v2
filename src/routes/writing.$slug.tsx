import { lazy, Suspense } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { posts, getPostBySlug } from "../posts";

const modules: Record<string, React.ComponentType> = {
  "hello-im-michi": lazy(() => import("../content/hello-im-michi.mdx")),
};

export const Route = createFileRoute("/writing/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) {
      throw notFound();
    }
    return post;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title ?? "Writing" },
      { name: "description", content: loaderData?.description },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData();
  const Content = modules[post.slug];

  return (
    <>
      <article className="article">
        <h1>{post.title}</h1>
        <span className="post-date">{post.date}</span>
        {Content && (
          <Suspense fallback={null}>
            <Content />
          </Suspense>
        )}
      </article>
      <Link to="/writing" className="back-link">
        Back to writing
      </Link>
    </>
  );
}
