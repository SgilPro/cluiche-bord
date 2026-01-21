#!/bin/bash
# 找出區域網路 IP 的腳本

echo "🔍 正在尋找你的區域網路 IP..."
echo ""

# macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
    if [ -z "$IP" ]; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
# Linux
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IP=$(hostname -I | awk '{print $1}')
# Windows (Git Bash)
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    IP=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}')
else
    echo "❌ 無法自動偵測 IP，請手動查看網路設定"
    exit 1
fi

if [ -z "$IP" ]; then
    echo "❌ 無法找到區域網路 IP"
    echo ""
    echo "請手動執行："
    echo "  macOS/Linux: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    echo "  Windows: ipconfig"
    exit 1
fi

echo "✅ 找到你的區域網路 IP: $IP"
echo ""
echo "📝 請在 .env.local 中設定："
echo "   NEXT_PUBLIC_SOCKET_URL=ws://$IP:4001"
echo ""
echo "或者執行："
echo "   echo 'NEXT_PUBLIC_SOCKET_URL=ws://$IP:4001' >> .env.local"
echo ""
