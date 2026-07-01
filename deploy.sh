#!/bin/bash
# ============================================================
# 随手记 — GitHub Pages 部署脚本
# 用法: bash deploy.sh <你的GitHub用户名> <你的GitHub Token>
# ============================================================

set -e

USERNAME="$1"
TOKEN="$2"
REPO="suishouji"

if [ -z "$USERNAME" ] || [ -z "$TOKEN" ]; then
  echo "用法: bash deploy.sh <GitHub用户名> <PersonalAccessToken>"
  echo "示例: bash deploy.sh zhangsan ghp_xxxxxxxxxxxx"
  exit 1
fi

cd "$(dirname "$0")"

echo "📦 1/4 生成打包文件..."
python build.py

echo ""
echo "🔗 2/4 通过 GitHub API 创建仓库..."
curl -s -X POST "https://api.github.com/user/repos" \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{\"name\":\"$REPO\",\"description\":\"随手记 - 轻量碎片信息随手记录工具\",\"private\":false}" \
  -o /dev/null -w "HTTP %{http_code}\n"

echo ""
echo "📤 3/4 推送代码..."
git add .
git diff --cached --quiet && git commit -m "随手记 v1.0 - 轻量碎片记录工具" || echo "已有更改，正在提交..."
git commit -m "随手记 v1.0 - 轻量碎片记录工具" 2>/dev/null || true
git remote remove origin 2>/dev/null || true
git remote add origin "https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO.git"
git branch -M main
git push -u origin main --force

echo ""
echo "⚙️ 4/4 启用 GitHub Pages..."
curl -s -X POST "https://api.github.com/repos/$USERNAME/$REPO/pages" \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{"source":{"branch":"main","path":"/docs"}}' \
  -o /dev/null -w "HTTP %{http_code}\n"

echo ""
echo "============================================"
echo "✅ 部署完成！"
echo ""
echo "🔗 你的网站地址:"
echo "   https://$USERNAME.github.io/$REPO/"
echo ""
echo "📱 下一步 — 生成 APK:"
echo "   1. 等 1-2 分钟让 Pages 生效"
echo "   2. 打开 https://pwabuilder.com"
echo "   3. 输入上面的网站地址"
echo "   4. 点击 Build → 下载 APK"
echo "   5. APK 传到小米手机直接安装"
echo "============================================"
