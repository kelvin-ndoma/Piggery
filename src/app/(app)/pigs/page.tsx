import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatWeight } from "@/lib/format";
import { labelSex, labelize } from "@/lib/utils";
import { PIG_CATEGORY, PIG_SEX, PIG_STATUS } from "@/types/domain";
import { listPigs } from "@/services/pigs";

export default async function PigsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireFarmContext();
  const query = await searchParams;
  const data = await listPigs(ctx, {
    q: query.q,
    status: query.status || "ACTIVE",
    category: query.category,
    sex: query.sex,
    page: query.page ? Number(query.page) : 1,
  });
  return (
    <div>
      <PageHeader title="Pigs" description="Every pig keeps its identity. Status changes are recorded, not deleted." action={can(ctx.role, "pigs:write") ? { href: "/pigs/new", label: "Add pig" } : undefined} />
      <form className="mb-4 grid gap-2 sm:grid-cols-4" method="get">
        <input name="q" defaultValue={query.q ?? ""} placeholder="Search ID, tag, breed" className="h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-base" />
        <Filter name="status" value={query.status || "ACTIVE"} options={["ALL", ...PIG_STATUS]} allLabel="All statuses" />
        <Filter name="category" value={query.category || ""} options={["", ...PIG_CATEGORY]} />
        <Filter name="sex" value={query.sex || ""} options={["", ...PIG_SEX]} />
        <button className="h-11 rounded-xl bg-primary px-4 text-sm text-primary-foreground sm:col-span-4 sm:w-fit">Filter</button>
      </form>
      <RecordTable
        columns={[
          { key: "pig", label: "Pig" },
          { key: "sex", label: "Sex" },
          { key: "category", label: "Category" },
          { key: "age", label: "Age" },
          { key: "pen", label: "Pen" },
          { key: "weight", label: "Weight" },
          { key: "status", label: "Status" },
        ]}
        rows={data.pigs.map((pig) => ({
          id: pig.id,
          cells: {
            pig: <Link className="font-medium text-primary" href={`/pigs/${pig.pigId}`}>{pig.pigId}{pig.earTag ? ` · ${pig.earTag}` : ""}</Link>,
            sex: labelSex(pig.sex),
            category: labelize(pig.category),
            age: pig.ageLabel,
            pen: pig.penLabel ?? "—",
            weight: formatWeight(pig.weightKg, ctx.farm.settings.weightUnit),
            status: <Badge value={pig.status} />,
          },
        }))}
        empty={{
          title: query.q || query.category || query.sex || (query.status && query.status !== "ACTIVE") ? "No pigs match those filters." : "Your farm doesn't have any pigs registered yet.",
          action: can(ctx.role, "pigs:write") ? { href: "/pigs/new", label: "Add your first pig" } : undefined,
        }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-500">
        <p>{data.total} pigs · page {data.page} of {data.pageCount}</p>
        {data.page > 1 ? <Link className="font-medium text-primary" href={pageHref(query, data.page - 1)}>Previous</Link> : null}
        {data.page < data.pageCount ? <Link className="font-medium text-primary" href={pageHref(query, data.page + 1)}>Next</Link> : null}
      </div>
    </div>
  );
}

function pageHref(query: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/pigs?${search}` : "/pigs";
}

function Filter({ name, value, options, allLabel = "Any" }: { name: string; value: string; options: string[]; allLabel?: string }) {
  return (
    <select name={name} defaultValue={value} className="h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-base">
      {options.map((option) => (
        <option key={option || "any"} value={option}>{option && option !== "ALL" ? labelize(option) : allLabel}</option>
      ))}
    </select>
  );
}
