import FoodDetailClient from "./client";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export default async function FoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return <FoodDetailClient />;
}
