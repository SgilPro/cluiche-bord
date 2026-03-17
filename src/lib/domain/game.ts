/**
 * Game type and variant domain models (from GET /api/games, /api/game_variants).
 */

export interface GameType {
  id: string;
  name: string;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface GameVariant {
  id: string;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  isOfficial?: boolean;
}

export function fromApiGameType(api: {
  id: string;
  name: string;
  description?: string;
  min_players?: number;
  max_players?: number;
}): GameType {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    minPlayers: api.min_players,
    maxPlayers: api.max_players,
  };
}

export function fromApiGameVariant(api: {
  id: string;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  is_official?: boolean;
}): GameVariant {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    config: api.config,
    isOfficial: api.is_official,
  };
}
