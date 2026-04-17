import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import ArticlePage from "../page";

const back = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back,
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "slug" ? "sample-article" : null),
  }),
}));

vi.mock("@/hooks/use-blog", () => ({
  useBlogPost: () => ({
    post: {
      id: "blog-1",
      title_en: "Sample Article",
      title_tr: "Ornek Makale",
      excerpt_en: "Excerpt",
      excerpt_tr: "Ozet",
      body_en: "<p>Article body</p>",
      body_tr: "<p>Makale govdesi</p>",
      featured_image_url: "https://example.com/article.jpg",
      tags: ["nutrition", "dog"],
      published_at: "2026-04-01T00:00:00.000Z",
      reading_time_min: 4,
      slug: "sample-article",
      is_featured: false,
      source_url: null,
      created_at: "2026-04-01T00:00:00.000Z",
    },
    isLoading: false,
    fetchPost: vi.fn(),
  }),
}));

describe("ArticlePage", () => {
  it("renders the shared screen shell heading and article content", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ArticlePage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("heading", { name: /learn/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sample article/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/article body/i)).toBeInTheDocument();
  });
});
