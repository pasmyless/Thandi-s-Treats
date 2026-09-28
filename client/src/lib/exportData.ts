export function rowsToCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
  const escapeCell = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(","), ...rows.map(row => headers.map(header => escapeCell(row[header])).join(","))].join("\n");
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const csv = rowsToCsv(rows);
  if (!csv) return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
