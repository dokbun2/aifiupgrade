#!/bin/bash

# Cloudflare Pages 수동 배포 스크립트
# GitHub Actions 또는 로컬에서 사용 가능

echo "📦 Cloudflare Pages 배포 준비..."

# Git 상태 확인
echo "🔍 Git 상태 확인..."
git status --short

# 최신 변경사항 푸시
echo "📤 GitHub에 푸시..."
git push origin main

echo "✅ 배포 완료!"
echo ""
echo "📌 Cloudflare Pages 대시보드에서 확인하세요:"
echo "   https://dash.cloudflare.com/pages/view/aifiup"
echo ""
echo "🌐 사이트 URL:"
echo "   https://aifiup.pages.dev"
echo ""
echo "💡 자동 배포가 안 될 경우:"
echo "   1. Cloudflare 대시보드에서 'View details' 클릭"
echo "   2. 'Retry deployment' 또는 'Deploy new version' 클릭"
echo ""
echo "⏰ 배포는 보통 1-2분 정도 걸립니다."