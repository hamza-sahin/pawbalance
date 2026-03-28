import CategoryClient from "./client";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  await params;
  return <CategoryClient />;
}
