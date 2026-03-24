/**
 * 手動測試情境 — 需要用 --headed --timeout=0 跑
 *
 * Scenario A: 你手動 create-room，Playwright 9 個 bot 自動加入
 *   npx playwright test e2e/manual-join.spec.ts --headed --timeout=0 -g "A:"
 *
 * Scenario B: 你手動 create-room + 一位手動 join，Playwright 8 個 bot 自動加入
 *   npx playwright test e2e/manual-join.spec.ts --headed --timeout=0 -g "B:"
 *
 * 流程：
 *   1. Playwright 開瀏覽器讓你操作
 *   2. 你建立房間並進入等待室（URL 會變成 /rooms/XXXXXX）
 *   3. Playwright 偵測到 URL 後，剩下的 bots 自動加入
 *
 * ⚠️  必須用 --headed（有頭模式），否則你看不到視窗
 * ⚠️  必須用 --timeout=0，否則等你操作時會 timeout
 */

import { chromium, type Browser, type BrowserContext } from "@playwright/test";
import { test, expect } from "@playwright/test";

const APP_URL = process.env.APP_URL!;
const API_ORIGIN = process.env.API_ORIGIN!;

// ── helpers ───────────────────────────────────────────────────────────────────

async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_ORIGIN}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as T;
}

async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_ORIGIN}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as T;
}

interface GuestResp { token: string; user_id: string }
interface RoomState { id: string; players: Array<{ nickname: string; user_id: string }>; max_players: number }

/** 建立 N 個 bot guests，並讓它們加入 roomId */
async function spawnBots(
  browser: Browser,
  roomId: string,
  count: number,
  startIndex: number,
): Promise<BrowserContext[]> {
  const guests = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      apiPost<GuestResp>("/api/auth/guest", { nickname: `Bot ${startIndex + i + 1}` }),
    ),
  );

  // join via API (sequential to avoid race conditions on the backend)
  for (const g of guests) {
    await apiPost(`/api/rooms/${roomId}/join`, {}, g.token);
  }

  // verify backend has all players
  const roomState = await apiGet<RoomState>(`/api/rooms/${roomId}`, guests[0].token);
  console.log(`  📋  後端房間人數：${roomState.players.length}/${roomState.max_players}`);
  roomState.players.forEach((p) => console.log(`       - ${p.nickname}`));

  // open browser contexts and navigate
  const contexts = await Promise.all(guests.map(() => browser.newContext()));
  await Promise.all(
    contexts.map(async (ctx, i) => {
      const page = await ctx.newPage();
      await page.goto(`${APP_URL}/rooms/${roomId}`);
      await page.evaluate(
        ({ token, userId }) => {
          localStorage.setItem("cluiche_bord_guest_token", token);
          localStorage.setItem("cluiche_bord_user_id", userId);
        },
        { token: guests[i].token, userId: guests[i].user_id },
      );
      await page.reload();
      await expect(page.getByRole("status")).toBeVisible({ timeout: 8_000 });
      console.log(`  ✓ Bot ${startIndex + i + 1} 進入等待室`);
    }),
  );

  return contexts;
}

/** 等待頁面 URL 變成 /rooms/:id，最多等 5 分鐘，回傳 roomId */
async function waitForRoomUrl(
  page: { url(): string; waitForURL(pattern: RegExp, options?: { timeout?: number }): Promise<void> },
  timeoutMs = 5 * 60_000,
): Promise<string> {
  console.log("\n⏳  等待你在瀏覽器建立房間並進入等待室...\n");
  await page.waitForURL(/\/rooms\/[A-Z0-9]+$/, { timeout: timeoutMs });
  const roomId = page.url().split("/rooms/")[1];
  console.log(`\n✅  偵測到房間：${roomId}\n`);
  return roomId;
}

// ── Scenario A ────────────────────────────────────────────────────────────────

test("A: 手動建立房間，9 個 bot 自動加入", async () => {
  test.setTimeout(0); // 手動操作，不設 timeout
  const browser = await chromium.launch({ headless: false });
  const botContexts: BrowserContext[] = [];

  try {
    // 開一個視窗讓你操作
    const hostCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    await hostPage.goto(`${APP_URL}/create-room`);

    // 等你建立房間並進入 /rooms/:id
    const roomId = await waitForRoomUrl(hostPage);

    // 9 個 bot 分三批加入
    console.log("🤖  第 1 批 bot（3 人）加入...");
    const bots1 = await spawnBots(browser, roomId, 3, 0);
    botContexts.push(...bots1);
    await new Promise((r) => setTimeout(r, 2_000));

    console.log("🤖  第 2 批 bot（3 人）加入...");
    const bots2 = await spawnBots(browser, roomId, 3, 3);
    botContexts.push(...bots2);
    await new Promise((r) => setTimeout(r, 5_000));

    console.log("🤖  第 3 批 bot（3 人）加入...");
    const bots3 = await spawnBots(browser, roomId, 3, 6);
    botContexts.push(...bots3);

    console.log("\n✅  9 個 bot 全部進入等待室");

    // reload 房主頁面 → 確認前端是否能看到全部玩家（診斷 polling 缺失）
    await hostPage.reload();
    const bannerText = await hostPage.getByRole("status").textContent();
    console.log(`\n🔍  房主頁面 reload 後 banner：${bannerText}`);
    console.log("   （如果人數沒到 10，代表後端有問題；如果到 10，代表前端沒有 real-time 更新）\n");

    console.log("   你現在可以在房主視窗按「開始遊戲」");
    console.log("   關閉視窗或按 Ctrl+C 結束測試\n");

    // 等到 host 頁面關閉或導離
    await hostPage.waitForEvent("close", { timeout: 0 }).catch(() => {});
  } finally {
    await Promise.all(botContexts.map((c) => c.close()));
    await browser.close();
  }
});

// ── Scenario B ────────────────────────────────────────────────────────────────

test("B: 手動建立房間 + 手動加入，8 個 bot 自動加入", async () => {
  test.setTimeout(0); // 手動操作，不設 timeout
  const browser = await chromium.launch({ headless: false });
  const botContexts: BrowserContext[] = [];

  try {
    // 視窗 1：你當房主
    const hostCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    await hostPage.goto(`${APP_URL}/create-room`);

    // 等房主建立房間
    const roomId = await waitForRoomUrl(hostPage);

    // 視窗 2：你手動 join（另一個玩家）
    const playerCtx = await browser.newContext();
    const playerPage = await playerCtx.newPage();
    await playerPage.goto(`${APP_URL}/rooms/${roomId}`);
    console.log(`\n🪟  第二個視窗已開啟：${APP_URL}/rooms/${roomId}`);
    console.log("   請在第二個視窗以玩家身份加入（或直接觀察）\n");

    // 等第二個視窗也進入等待室（確認 URL）
    await playerPage.waitForURL(/\/rooms\/[A-Z0-9]+$/, { timeout: 60_000 });

    // 8 個 bot 分三批加入
    console.log("🤖  第 1 批 bot（3 人）加入...");
    const bots1 = await spawnBots(browser, roomId, 3, 1);
    botContexts.push(...bots1);
    await new Promise((r) => setTimeout(r, 2_000));

    console.log("🤖  第 2 批 bot（3 人）加入...");
    const bots2 = await spawnBots(browser, roomId, 3, 4);
    botContexts.push(...bots2);
    await new Promise((r) => setTimeout(r, 5_000));

    console.log("🤖  第 3 批 bot（2 人）加入...");
    const bots3 = await spawnBots(browser, roomId, 2, 7);
    botContexts.push(...bots3);

    console.log("\n✅  8 個 bot 全部進入等待室");
    console.log("   你現在可以在房主視窗按「開始遊戲」");
    console.log("   關閉視窗或按 Ctrl+C 結束測試\n");

    // 等到 host 頁面關閉或導離
    await hostPage.waitForEvent("close", { timeout: 0 }).catch(() => {});

    await playerCtx.close();
  } finally {
    await Promise.all(botContexts.map((c) => c.close()));
    await browser.close();
  }
});
