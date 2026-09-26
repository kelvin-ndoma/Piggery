import { EmptyState } from "@/components/empty-state";

export default function PigNotFound() {
  return <EmptyState title="That pig was not found on this farm." action={{ href: "/pigs", label: "Back to pigs" }} />;
}
