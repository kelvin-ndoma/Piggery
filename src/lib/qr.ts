export function pigCodeFromScan(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return null;
  const fromPath = trimmed.match(/\/pigs\/(PIG-[A-Za-z0-9]+)\/?(?:[?#].*)?$/i);
  if (fromPath?.[1]) return fromPath[1].toUpperCase();
  if (/^PIG-[A-Z0-9]{2,16}$/i.test(trimmed)) return trimmed.toUpperCase();
  return null;
}
