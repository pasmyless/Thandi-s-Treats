import { describe, expect, it } from "vitest";
import { createAdminSession, getAdminSession } from "./adminAuth";

describe("administrator sessions", () => {
  it("creates a signed, readable session for an administrator", async () => {
    const token = await createAdminSession({ email: "mylesmuoka@gmail.com", displayName: "Myles" });
    const session = await getAdminSession(`other=value; thandis_admin=${token}`);

    expect(session).toEqual({ email: "mylesmuoka@gmail.com", displayName: "Myles" });
  });

  it("rejects an invalid administrator cookie", async () => {
    await expect(getAdminSession("thandis_admin=not-a-valid-token")).resolves.toBeNull();
  });
});
