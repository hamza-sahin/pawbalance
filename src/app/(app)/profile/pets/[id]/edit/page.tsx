import EditPetClient from "./client";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export default async function EditPetPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return <EditPetClient />;
}
