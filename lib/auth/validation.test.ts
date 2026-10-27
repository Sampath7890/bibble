import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "./validation";

describe("authentication validation", () => {
  it("normalizes signup email addresses", () => {
    const result = signupSchema.parse({
      name: "  Ada Lovelace  ",
      email: " ADA@EXAMPLE.COM ",
      password: "Strong-password-123!",
      confirmPassword: "Strong-password-123!",
    });

    expect(result.name).toBe("Ada Lovelace");
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects passwords that do not meet the policy", () => {
    const result = signupSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched password confirmation", () => {
    const result = signupSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Strong-password-123!",
      confirmPassword: "Different-password-123!",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid login shape", () => {
    expect(
      loginSchema.safeParse({
        email: " ADA@EXAMPLE.COM ",
        password: "anything-non-empty",
      }).data,
    ).toEqual({
      email: "ada@example.com",
      password: "anything-non-empty",
    });
  });
});
