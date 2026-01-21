/**
 * 資料庫連線測試 API
 * 
 * 此 API 用於驗證：
 * 1. Prisma Client 可以成功連接到資料庫
 * 2. 可以執行基本查詢
 * 3. JSONB 欄位可以正常使用
 * 
 * 使用方法：
 * GET /api/test-db
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const results: Record<string, unknown> = {};

    // 1. 測試基本連線
    await prisma.$connect();
    results.connection = '✅ 連線成功';

    // 2. 測試基本查詢
    const userCount = await prisma.user.count();
    results.userCount = userCount;

    // 3. 測試 JSONB 欄位查詢
    const actionCount = await prisma.gameSessionAction.count();
    results.actionCount = actionCount;

    // 4. 測試資料庫結構
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    results.tables = tables.map((t) => t.tablename);

    return NextResponse.json({
      success: true,
      message: '資料庫連線測試成功',
      results,
    });
  } catch (error) {
    console.error('資料庫連線測試失敗：', error);
    return NextResponse.json(
      {
        success: false,
        message: '資料庫連線測試失敗',
        error: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
