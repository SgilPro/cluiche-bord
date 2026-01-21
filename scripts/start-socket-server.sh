#!/bin/bash
# 啟動 Socket.IO 伺服器的腳本（會先清理舊程序）

echo "🔍 檢查 port 4001 是否被占用..."

# 找出並停止占用 port 4001 的程序
PID=$(lsof -ti:4001 2>/dev/null)
if [ ! -z "$PID" ]; then
  echo "⚠️  發現程序 $PID 正在使用 port 4001，正在停止..."
  kill -9 $PID 2>/dev/null
  sleep 1
  echo "✅ 已停止舊程序"
else
  echo "✅ Port 4001 可用"
fi

echo ""
echo "🚀 啟動 Socket.IO 伺服器..."
npm run socket-server
