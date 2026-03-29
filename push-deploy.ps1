param(
    [string]$msg = "update"
)

Write-Host "📦 Git add & commit..." -ForegroundColor Cyan
git add .
git commit -m $msg

Write-Host "⬆️  GitHub'ga push..." -ForegroundColor Cyan
git push origin main

Write-Host "🚀 Serverga deploy..." -ForegroundColor Cyan
ssh root@sergeli0606.uz "cd /var/www/xurshid && git pull origin main && source venv/bin/activate && sudo systemctl restart xurshid && sleep 2 && sudo systemctl status xurshid --no-pager -n 5"

Write-Host "✅ Deploy tugadi!" -ForegroundColor Green
