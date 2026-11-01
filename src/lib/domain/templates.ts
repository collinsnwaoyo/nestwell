/** Fills `{field}` placeholders in a message template. Unknown fields are left as-is. */
export function fillTemplate(template: string, fields: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => fields[key] ?? match);
}
