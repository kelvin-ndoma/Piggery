import { redirect } from "next/navigation";

export default async function BreedingActionRedirect({ searchParams }: { searchParams: Promise<{ sow?: string }> }) {
  const query = await searchParams;
  redirect(query.sow ? `/actions/serving?sow=${query.sow}` : "/actions/serving");
}
