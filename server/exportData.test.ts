import { describe, expect, it } from "vitest";
import { rowsToCsv } from "../client/src/lib/exportData";

describe("CSV export", () => {
  it("escapes commas, quotes, and newlines for spreadsheet-safe output", () => {
    expect(rowsToCsv([
      { customer: "Amahle", notes: "Birthday, please\nadd a card", status: "new" },
      { customer: "Myles", notes: '"Thank you"', status: "confirmed" },
    ])).toBe('customer,notes,status\nAmahle,"Birthday, please\nadd a card",new\nMyles,"""Thank you""",confirmed');
  });

  it("returns an empty string for an empty dataset", () => {
    expect(rowsToCsv([])).toBe("");
  });
});
