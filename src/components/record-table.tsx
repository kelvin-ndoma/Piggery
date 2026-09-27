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
        {rows.map((row) => {
          const [lead, ...rest] = columns;
          return (
            <article key={row.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              {lead ? <div className="min-w-0 break-words text-base">{row.cells[lead.key]}</div> : null}
              {rest.length > 0 ? (
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                  {rest.map((column) => (
                    <div key={column.key} className="min-w-0">
                      <dt className="text-xs text-stone-500">{column.label}</dt>
                      <dd className="break-words text-sm font-medium">{row.cells[column.key]}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}
