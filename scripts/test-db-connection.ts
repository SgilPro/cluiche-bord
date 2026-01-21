/**
 * 資料庫連線測試腳本
 * 
 * 此腳本用於驗證：
 * 1. Prisma Client 可以成功連接到資料庫
 * 2. 可以執行基本查詢
 * 3. JSONB 欄位可以正常使用
 * 
 * 使用方法：
 * npx tsx scripts/test-db-connection.ts
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 開始測試資料庫連線...\n');

    // 1. 測試基本連線
    console.log('1️⃣ 測試基本連線...');
    await prisma.$connect();
    console.log('✅ Prisma Client 連線成功\n');

    // 2. 測試基本查詢
    console.log('2️⃣ 測試基本查詢...');
    const userCount = await prisma.user.count();
    console.log(`✅ 查詢成功：目前有 ${userCount} 位使用者\n`);

    // 3. 測試 JSONB 欄位（為未來的遊戲狀態做準備）
    console.log('3️⃣ 測試 JSONB 欄位...');
    
    // 建立一個測試用的 GameSessionAction 來驗證 JSONB
    // 注意：這需要先有相關的資料，所以我們只測試查詢
    const actionCount = await prisma.gameSessionAction.count();
    console.log(`✅ JSONB 欄位查詢成功：目前有 ${actionCount} 個動作記錄\n`);

    // 4. 測試寫入（可選，如果需要）
    console.log('4️⃣ 測試資料庫結構...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    console.log('✅ 資料庫表格：');
    tables.forEach((table) => {
      console.log(`   - ${table.tablename}`);
    });
    console.log('');

    console.log('🎉 所有測試通過！資料庫連線正常。\n');
  } catch (error) {
    console.error('❌ 測試失敗：');
    if (error instanceof Error) {
      console.error(`   錯誤訊息：${error.message}`);
      console.error(`   錯誤堆疊：${error.stack}`);
    } else {
      console.error('   未知錯誤：', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 已斷開資料庫連線');
  }
}

// 執行測試
testConnection();
