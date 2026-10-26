/** Full navigation after a mutation so lists are not served from a stale client cache. */
export function goAfterSave(href?: string) {
  if (href) {
    window.location.assign(href);
    return;
  }
  window.location.reload();
}
