import type {
  CreateRoomBody,
  GuestAuthResponse,
  JoinRoomBody,
  JoinRoomResponse,
  ListGameTypesResponse,
  ListGameVariantsResponse,
  ListRoomsResponse,
  Room,
} from "./types";

const DEFAULT_ORIGIN = "http://localhost:4000";

let apiOriginOverride: string | undefined;

/**
 * Configurable API base origin (e.g. NEXT_PUBLIC_API_ORIGIN).
 * Use setApiOriginForTesting in tests to override.
 */
export function getApiOrigin(): string {
  if (apiOriginOverride !== undefined) return apiOriginOverride;
  const env = process.env.NEXT_PUBLIC_API_ORIGIN;
  return (typeof env === "string" && env.trim() !== "" ? env.trim() : null) ?? DEFAULT_ORIGIN;
}

/**
 * Override API origin in tests. Pass undefined to clear.
 */
export function setApiOriginForTesting(origin: string | undefined): void {
  apiOriginOverride = origin;
}

let storedToken: string | null = null;

export function getToken(): string | null {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem("cluiche_bord_guest_token");
    } catch {
      return storedToken;
    }
  }
  return storedToken;
}

export function setToken(token: string | null): void {
  storedToken = token;
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      if (token === null) localStorage.removeItem("cluiche_bord_guest_token");
      else localStorage.setItem("cluiche_bord_guest_token", token);
    } catch {
      // ignore
    }
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  method?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, ...init } = options;
  const url = `${getApiOrigin()}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined && body !== null && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    ...init,
    method,
    headers,
    body:
      body !== undefined && body !== null
        ? typeof body === "string"
          ? body
          : JSON.stringify(body)
        : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const j = JSON.parse(text) as { message?: string; error?: string };
      message = j.message ?? j.error ?? text;
    } catch {
      // use text as-is
    }
    throw new Error(`API ${res.status}: ${message}`);
  }
  const contentLength = res.headers?.get?.("content-length");
  if (res.status === 204 || contentLength === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/**
 * Create a guest session. Optionally pass device_id (UUID) for persistence,
 * and nickname for display name. Stores token for subsequent API calls.
 */
export async function createGuest(
  deviceId?: string,
  nickname?: string
): Promise<GuestAuthResponse> {
  const body: { device_id?: string; nickname?: string } = {};
  if (deviceId !== undefined && deviceId !== "") body.device_id = deviceId;
  if (nickname !== undefined && nickname !== "") body.nickname = nickname;
  const data = await request<GuestAuthResponse>("/api/auth/guest", {
    method: "POST",
    body: Object.keys(body).length ? body : {},
  });
  setToken(data.token);
  return data;
}

/**
 * Create a room. Requires guest token (createGuest first).
 */
export async function createRoom(body: CreateRoomBody): Promise<Room> {
  return request<Room>("/api/rooms", { method: "POST", body });
}

export interface ListRoomsParams {
  game_id?: string;
  limit?: number;
}

/**
 * List rooms. Optional filter by game_id and limit.
 */
export async function listRooms(params?: ListRoomsParams): Promise<ListRoomsResponse> {
  const search = new URLSearchParams();
  if (params?.game_id) search.set("game_id", params.game_id);
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  const q = search.toString();
  return request<ListRoomsResponse>(`/api/rooms${q ? `?${q}` : ""}`, { method: "GET" });
}

/**
 * Get a single room by id (6-char alphanumeric).
 */
export async function getRoom(id: string): Promise<Room> {
  return request<Room>(`/api/rooms/${encodeURIComponent(id)}`, { method: "GET" });
}

/**
 * Join a room. Optional nickname in body. Requires guest token.
 */
export async function joinRoom(id: string, body?: JoinRoomBody): Promise<JoinRoomResponse> {
  return request<JoinRoomResponse>(`/api/rooms/${encodeURIComponent(id)}/join`, {
    method: "POST",
    body: body ?? {},
  });
}

/**
 * Leave a room. Requires guest token.
 */
export async function leaveRoom(id: string): Promise<void> {
  await request<void>(`/api/rooms/${encodeURIComponent(id)}/leave`, { method: "POST", body: {} });
}

/**
 * List game types (catalog for room creation). No auth required.
 */
export async function listGameTypes(): Promise<ListGameTypesResponse> {
  return request<ListGameTypesResponse>("/api/games", { method: "GET" });
}

export interface ListGameVariantsParams {
  game_id: string;
  is_official?: boolean;
}

/**
 * List game variants for a game (e.g. Basic10 for werewolf). No auth required.
 */
export async function listGameVariants(
  params: ListGameVariantsParams
): Promise<ListGameVariantsResponse> {
  const search = new URLSearchParams({ game_id: params.game_id });
  if (params.is_official !== undefined) search.set("is_official", String(params.is_official));
  return request<ListGameVariantsResponse>(`/api/game_variants?${search}`, { method: "GET" });
}
