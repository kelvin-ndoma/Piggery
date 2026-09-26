export function formatPigId(sequence: number): string {
  return `PIG-${String(sequence).padStart(4, "0")}`;
}

export function formatLitterNumber(year: number, sequence: number): string {
  return `L-${year}-${String(sequence).padStart(3, "0")}`;
}

export function formatVisitNumber(year: number, sequence: number): string {
  return `V-${year}-${String(sequence).padStart(3, "0")}`;
}
