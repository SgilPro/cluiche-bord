/**
 * Multi-client E2E test: 10 browser contexts joining the same room
 *
 * Run:
 *   npx playwright test e2e/multi-client.spec.ts
 *   npx playwright test e2e/multi-client.spec.ts --headed   # 有頭模式看到瀏覽器
 *
 * 需要後端 (Elixir) 在跑，且 NEXT_PUBLIC_API_ORIGIN 指向正確位置。
 */

import { chromium, type Browser, type BrowserContext } from "@playwright/test";
import { test, expect } from "@playwright/test";

const API_ORIGIN = process.env.API_ORIGIN!;

// ── helpers ──────────────────────────────────────────────────────────────────

async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_ORIGIN}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as T;
}

async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_ORIGIN}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as T;
}

interface GuestResp {
  token: string;
  user_id: string;
}
interface RoomResp {
  id: string;
  name: string;
  host_user_id: string;
}
interface GamesResp {
  games: Array<{ id: string; name: string }>;
}

// ── test ─────────────────────────────────────────────────────────────────────

test("10 clients: host creates room, 9 others join and see waiting room", async () => {
  const browser: Browser = await chromium.launch();
  const contexts: BrowserContext[] = [];

  try {
    // ── Step 1: create 10 guest tokens via API ────────────────────────────
    const guests = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        apiPost<GuestResp>("/api/auth/guest", { nickname: `玩家 ${i + 1}` }),
      ),
    );
    expect(guests).toHaveLength(10);

    // ── Step 2: get a valid game_id ───────────────────────────────────────
    const { games } = await apiGet<GamesResp>("/api/games", guests[0].token);
    expect(games.length).toBeGreaterThan(0);
    const gameId = games[0].id;

    // ── Step 3: host (guest[0]) creates room ─────────────────────────────
    const room = await apiPost<RoomResp>(
      "/api/rooms",
      { name: "E2E 測試房間", game_id: gameId },
      guests[0].token,
    );
    expect(room.id).toBeTruthy();
    const roomId = room.id;

    // ── Step 4: guests[1..9] join room via API ────────────────────────────
    await Promise.all(
      guests
        .slice(1)
        .map((g) => apiPost(`/api/rooms/${roomId}/join`, {}, g.token)),
    );

    // ── Step 5: open 10 browser contexts, inject tokens, navigate ────────
    contexts.push(
      ...(await Promise.all(
        guests.map(() => browser.newContext({ storageState: undefined })),
      )),
    );

    const pages = await Promise.all(
      contexts.map(async (ctx, i) => {
        const page = await ctx.newPage();
        // inject guest token into localStorage
        await page.goto(`http://localhost:3000/rooms/${roomId}`);
        await page.evaluate(
          ({ token, userId }) => {
            localStorage.setItem("cluiche_bord_guest_token", token);
            localStorage.setItem("cluiche_bord_user_id", userId);
          },
          { token: guests[i].token, userId: guests[i].user_id },
        );
        // reload so the page picks up the token
        await page.reload();
        return page;
      }),
    );

    // ── Step 6: verify all 10 pages show waiting room ─────────────────────
    await Promise.all(
      pages.map(async (page, i) => {
        // Should show player count banner
        await expect(page.getByRole("status")).toBeVisible({ timeout: 8_000 });
        // Should NOT show an error
        await expect(
          page.getByText("載入房間失敗"),
        ).not.toBeVisible();
        console.log(`✓ 玩家 ${i + 1} 看到等待室`);
      }),
    );

    // ── Step 7: host page shows 開始遊戲 button ───────────────────────────
    const hostPage = pages[0];
    // reload with host token properly set
    await hostPage.evaluate(
      ({ token, userId }) => {
        localStorage.setItem("cluiche_bord_guest_token", token);
        localStorage.setItem("cluiche_bord_user_id", userId);
      },
      { token: guests[0].token, userId: guests[0].user_id },
    );
    await hostPage.reload();
    const startBtn = hostPage.getByRole("button", { name: "開始遊戲" });
    await expect(startBtn).toBeVisible({ timeout: 8_000 });
    console.log("✓ 房主看到「開始遊戲」按鈕");
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
    await browser.close();
  }
});

// ── create-room UI flow ───────────────────────────────────────────────────────

test("create-room: UI form → success page", async ({ page }) => {
  await page.goto("http://localhost:3000/create-room");
  await expect(page.getByText("建立房間")).toBeVisible();

  await page.getByPlaceholder("請輸入房間名稱").fill("UI 測試房間");
  await page.getByPlaceholder("請輸入暱稱").fill("測試玩家");

  // wait for games to load then select first option
  const gameSelect = page.locator("select").first();
  await expect(gameSelect).not.toContainText("載入中...", { timeout: 8_000 });
  await gameSelect.selectOption({ index: 1 });

  await page.getByRole("button", { name: "確認建立" }).click();

  // Should land on success view
  await expect(page.getByText("建立成功")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("UI 測試房間")).toBeVisible();
  console.log("✓ create-room 成功");
});
