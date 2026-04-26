param(
    [string]$msg = "update"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "======================================" -ForegroundColor DarkGray
Write-Host "  PUSH and DEPLOY" -ForegroundColor White
Write-Host "======================================" -ForegroundColor DarkGray
Write-Host ""

# 1. Git add + commit
Write-Host "[1/3] Git add + commit: $msg" -ForegroundColor Cyan
git add .
$commitOutput = git commit -m $msg 2>&1
if ($LASTEXITCODE -ne 0) {
    if ("$commitOutput" -match "nothing to commit") {
        Write-Host "  O'zgarish yoq, commit otkazib yuborildi." -ForegroundColor Yellow
    } else {
        Write-Host "  Commit xatosi: $commitOutput" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  $commitOutput" -ForegroundColor DarkGray
}

# 2. Push
Write-Host ""
Write-Host "[2/3] GitHub'ga push..." -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Push xatosi!" -ForegroundColor Red
    exit 1
}

# 3. Deploy via SSH
Write-Host ""
Write-Host "[3/3] Serverga deploy (206.81.17.211)..." -ForegroundColor Cyan
$sshCmd = "cd /var/www/alisher && git pull origin main && source venv/bin/activate && sudo systemctl restart alisher && sleep 2 && sudo systemctl status alisher --no-pager -n 5"
ssh root@206.81.17.211 $sshCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Deploy xatosi!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor DarkGray
Write-Host "  Deploy muvaffaqiyatli tugadi!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor DarkGray
Write-Host ""
