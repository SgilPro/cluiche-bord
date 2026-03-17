/**
 * Guest domain model (from POST /api/auth/guest response).
 */

export interface Guest {
  token: string;
  userId: string;
  nickname: string | null;
}

export function fromApiGuest(api: {
  token: string;
  user_id: string;
  nickname: string | null;
}): Guest {
  return {
    token: api.token,
    userId: api.user_id,
    nickname: api.nickname,
  };
}
