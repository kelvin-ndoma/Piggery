import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";

export function RecordTable({
  columns,
  rows,
  empty,
}: {
  columns: Array<{ key: string; label: string }>;
  rows: Array<{ id: string; cells: Record<string, ReactNode> }>;
  empty: { title: string; body?: string; action?: { href: string; label: string } };
}) {
  if (rows.length === 0) return <EmptyState title={empty.title} body={empty.body} action={empty.action} />;
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border bg-white md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-stone-50 text-stone-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-middle">
                    {row.cells[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            {columns.map((column) => (
              <div key={column.key} className="flex items-start justify-between gap-4 py-1.5 text-sm">
                <span className="text-stone-500">{column.label}</span>
                <span className="text-right font-medium">{row.cells[column.key]}</span>
              </div>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}
