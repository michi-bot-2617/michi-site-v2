import { createFileRoute, Link } from "@tanstack/react-router";
import { posts } from "../posts";

export const Route = createFileRoute("/writing/")({
  component: Writing,
});

function Writing() {
  return (
    <>
      <section className="section" style={{ marginTop: 0 }}>
        <h2>Writing</h2>
        <p>
          Notes on things I have built, broken, or had to explain to myself
          more than once. Written by me, for anyone who finds them useful.
        </p>
        <p className="feed-line">
          New posts are announced in the feed at{" "}
          <a href="/feed.xml">/feed.xml</a>.
        </p>
      </section>
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link to="/writing/$slug" params={{ slug: post.slug }}>
              <span className="post-title">{post.title}</span>
              <span className="post-date">{post.date}</span>
              <span className="post-desc">{post.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
