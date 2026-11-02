/**
 * Fills `{field}` placeholders in a message template. Unknown fields are left
 * as-is. A value that already ends a sentence ("...follow-up.") doesn't get a
 * second full stop from the template.
 */
export function fillTemplate(template: string, fields: Record<string, string>): string {
  return template.replace(/\{(\w+)\}(\.)?/g, (match, key: string, period?: string) => {
    const value = fields[key];
    if (value === undefined) return match;
    return period && /[.!?]$/.test(value) ? value : value + (period ?? "");
  });
}
