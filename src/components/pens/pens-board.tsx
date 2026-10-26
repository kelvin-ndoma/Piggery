"use client";

import { useEffect, useState } from "react";
import { AddBlockForm, AddPenForm, GrowerBatchForm } from "@/components/pens/pen-forms";
import { penPurpose } from "@/lib/utils";
import type { ApiResponse, SelectOption } from "@/types/api";

export type HousingPenCard = {
  id: string;
  code: string;
  type: string;
  capacity: number | null;
  occupied: number;
  groupBornOn: string;
  motherId: string;
  ageLabel: string | null;
  motherLabel: string | null;
};

export type HousingBlockCard = {
  id: string;
  name: string;
  pens: HousingPenCard[];
};

export function PensBoard({
  initial,
  canEdit,
  sows,
}: {
  initial: HousingBlockCard[];
  canEdit: boolean;
  sows: SelectOption[];
}) {
  const [buildings, setBuildings] = useState(initial);

  useEffect(() => {
    setBuildings(initial);
  }, [initial]);

  async function reload() {
    const response = await fetch("/api/housing", { cache: "no-store" });
    const payload = (await response.json()) as ApiResponse<HousingBlockCard[]>;
    if (payload.success) setBuildings(payload.data);
  }

  const blocks = [...new Set(buildings.map((building) => building.name))];

  return (
    <div className="space-y-6">
      {canEdit ? (
        <div className="grid overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 md:grid-cols-2">
          <div className="border-b border-stone-100 p-5 md:border-b-0 md:border-r">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Block</p>
            <AddBlockForm onSuccess={reload} />
          </div>
          <div className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Pen</p>
            <AddPenForm key={blocks.join("|")} blocks={blocks} sows={sows} onSuccess={reload} />
          </div>
        </div>
      ) : null}

      {buildings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 px-6 py-16 text-center">
          <p className="font-medium text-stone-900">No blocks yet</p>
          <p className="mt-1 text-sm text-stone-500">Add a block, then add pen numbers under it.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {buildings.map((building) => (
            <section key={building.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl bg-primary px-3 text-lg font-semibold text-primary-foreground">
                    {building.name}
                  </span>
                  <div>
                    <h2 className="font-semibold text-stone-950">Block {building.name}</h2>
                    <p className="text-sm text-stone-500">
                      {building.pens.length === 0
                        ? "No pens"
                        : `${building.pens.length} pen${building.pens.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>
              </div>
              {building.pens.length === 0 ? (
                <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                  Add a pen number to this block.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {building.pens.map((pen) => (
                    <li
                      key={pen.id}
                      className="rounded-xl border border-stone-200 bg-[#fbfaf7] px-3 py-3"
                    >
                      <p className="text-base font-semibold tracking-tight text-stone-950">
                        {building.name}-{pen.code}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">{penPurpose(pen.type)}</p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {penOccupancy(pen.occupied, pen.capacity)}
                      </p>
                      {pen.type === "GROWER" ? (
                        <>
                          <p className="mt-2 text-xs text-stone-700">Age: {pen.ageLabel ?? "Not recorded"}</p>
                          <p className="text-xs text-stone-700">Mother: {pen.motherLabel ?? "Not recorded"}</p>
                          {canEdit ? (
                            <GrowerBatchForm
                              key={`${pen.id}-${pen.groupBornOn}-${pen.motherId}`}
                              penId={pen.id}
                              groupBornOn={pen.groupBornOn}
                              motherId={pen.motherId}
                              sows={sows}
                              onSuccess={reload}
                            />
                          ) : null}
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function penOccupancy(occupied: number, capacity: number | null) {
  if (occupied === 0 && capacity != null) return `Holds ${capacity}`;
  if (occupied === 0) return "Empty";
  if (capacity != null) return `${occupied} of ${capacity} on record`;
  return `${occupied} pig${occupied === 1 ? "" : "s"} on record`;
}
