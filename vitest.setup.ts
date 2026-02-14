import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Stub CSS imports
vi.mock("*.css", () => ({}));

// Stub cn utility across all packages
vi.mock("./lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}));
