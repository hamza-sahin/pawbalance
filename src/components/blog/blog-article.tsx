"use client";

import { useLocale } from "next-intl";
import type { BlogPost } from "@/lib/types";
import { localise } from "@/lib/types";
import DOMPurify from "isomorphic-dompurify";

export function BlogArticle({ post }: { post: BlogPost }) {
  const locale = useLocale();
  const body = localise(post, "body", locale);
  const sanitized = DOMPurify.sanitize(body, {
    ALLOWED_TAGS: [
      "h2", "h3", "h4", "p", "a", "img", "ul", "ol", "li",
      "strong", "em", "blockquote", "br", "figure", "figcaption",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "loading"],
  });

  return (
    <div
      className="blog-prose"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
