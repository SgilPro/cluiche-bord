/**
 * Deterministic avatar color generator based on player ID.
 * No backend required — derived from user_id hash.
 */

/** Palette of 8 distinct colors */
const AVATAR_COLORS = [
  "#E57373", // red
  "#FFB74D", // orange
  "#FFF176", // yellow
  "#81C784", // green
  "#4FC3F7", // blue
  "#CE93D8", // purple
  "#F48FB1", // pink
  "#80DEEA", // teal
];

/**
 * Simple djb2-style string hash → index into color palette.
 */
function hashStringToIndex(str: string, buckets: number): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash) % buckets;
}

export function getAvatarColor(playerId: string): string {
  return AVATAR_COLORS[hashStringToIndex(playerId, AVATAR_COLORS.length)];
}

/**
 * Returns initials for the player: first char of nickname or seat label.
 */
export function getAvatarInitial(
  nickname: string | null | undefined,
  seatIndex: number
): string {
  if (nickname && nickname.length > 0) return nickname[0].toUpperCase();
  return String(seatIndex + 1);
}
