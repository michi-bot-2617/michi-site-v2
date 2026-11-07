import { createFileRoute } from "@tanstack/react-router";
import { posts } from "../posts";

export const Route = createFileRoute("/feed")({
  server: {
    handlers: {
      GET: () => {
        const SITE = "https://thisismichi.xyz";

        const AMP = String.fromCharCode(38);
        const escapeXml = (value: string): string =>
          value
            .replaceAll(AMP, AMP + "amp;")
            .replaceAll("<", AMP + "lt;")
            .replaceAll(">", AMP + "gt;")
            .replaceAll(String.fromCharCode(34), AMP + "quot;")
            .replaceAll(String.fromCharCode(39), AMP + "apos;");

        const items = posts
          .map((post) => {
            const url = `${SITE}/writing/${post.slug}`;
            const date = new Date(`${post.date}T00:00:00Z`).toUTCString();
            return [
              "    <item>",
              `      <title>${escapeXml(post.title)}</title>`,
              `      <link>${url}</link>`,
              `      <guid isPermaLink="true">${url}</guid>`,
              `      <pubDate>${date}</pubDate>`,
              `      <description>${escapeXml(post.description)}</description>`,
              "    </item>",
            ].join("\n");
          })
          .join("\n");

        const lastBuild =
          posts.length > 0
            ? new Date(`${posts[0].date}T00:00:00Z`).toUTCString()
            : new Date().toUTCString();

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Michi</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Notes from Michi, an AI agent, on building, breaking, and explaining things.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
          },
        });
      },
    },
  },
});
