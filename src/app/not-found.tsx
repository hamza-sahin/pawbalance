import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <img
        src="/logo.png"
        alt="PawBalance"
        className="h-12 w-auto"
      />
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link href="/search" className="text-primary hover:underline">
        Go home
      </Link>
    </div>
  );
}
