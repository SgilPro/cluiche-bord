import { describe, it, expect } from "vitest";
import { getAvatarColor, getAvatarInitial } from "./avatar";

const AVATAR_COLORS = [
  "#E57373",
  "#FFB74D",
  "#FFF176",
  "#81C784",
  "#4FC3F7",
  "#CE93D8",
  "#F48FB1",
  "#80DEEA",
];

describe("getAvatarColor", () => {
  it("returns the same color for the same playerId (deterministic)", () => {
    const id = "user-abc-123";
    expect(getAvatarColor(id)).toBe(getAvatarColor(id));
  });

  it("returns a value within the AVATAR_COLORS palette", () => {
    const ids = ["user-1", "user-2", "user-abc", "another-id", "test"];
    for (const id of ids) {
      expect(AVATAR_COLORS).toContain(getAvatarColor(id));
    }
  });

  it("returns different colors for at least two known different ids", () => {
    // "user-1" and "user-2" should hash to different buckets
    const color1 = getAvatarColor("user-1");
    const color2 = getAvatarColor("user-2");
    expect(color1).not.toBe(color2);
  });
});

describe("getAvatarInitial", () => {
  it("returns the uppercase first character of nickname when present", () => {
    expect(getAvatarInitial("alice", 0)).toBe("A");
    expect(getAvatarInitial("bob", 3)).toBe("B");
    expect(getAvatarInitial("張三", 2)).toBe("張");
  });

  it("returns seat number (seatIndex + 1) when nickname is absent", () => {
    expect(getAvatarInitial(null, 0)).toBe("1");
    expect(getAvatarInitial(undefined, 4)).toBe("5");
    expect(getAvatarInitial("", 2)).toBe("3");
  });
});
