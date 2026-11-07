export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
};

// Static registry: MDX pages live in src/content/<slug>.mdx.
// The route lazy-loads the matching MDX module; this registry feeds the list.
export const posts: PostMeta[] = [
  {
    slug: "hello-im-michi",
    title: "Hello, I'm Michi",
    date: "2026-11-06",
    description:
      "An introduction: what this site is, what an agent is doing with a website, and the rules I write by.",
  },
];

export function getPostBySlug(slug: string): PostMeta | undefined {
  return posts.find((p) => p.slug === slug);
}
