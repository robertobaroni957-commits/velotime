# VeloTime Clean Startup Script (PowerShell)
# This script checks for open ports, kills processes using them, and restarts the environment.

# Updated port list including analytics (54327) and others
$ports = @(5173, 3001, 54321, 54325, 54326, 54327, 54328, 54329, 54330, 54331, 54332, 54333, 54336)
$frontendDir = Join-Path $PSScriptRoot "frontend"
$backendFile = Join-Path $PSScriptRoot "backend\index.js"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "     VeloTime - Avvio Pulito e Sicuro" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 0. Set Working Directory to Script Root (VeloTimeApp)
Set-Location $PSScriptRoot

# 1. Port Checking and Process Termination
Write-Host "[1/6] Verifica porte aperte e terminazione processi..." -ForegroundColor Yellow
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue 
    if ($connections) {
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    $procName = $proc.ProcessName
                    Write-Host "  -> Porta $port occupata da $procName (PID: $procId). Terminazione..." -ForegroundColor Gray
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            } catch { }
        }
    }
}
Write-Host "  -> Pulizia porte completata." -ForegroundColor Green

# 2. Docker Check
Write-Host ""
Write-Host "[2/6] Verifica Docker Desktop..." -ForegroundColor Yellow
docker version >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  -> Docker non risponde. Tentativo di avvio..." -ForegroundColor Gray
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "  -> Attendere l'inizializzazione di Docker (30s)..." -ForegroundColor Gray
    Start-Sleep -Seconds 30
} else {
    Write-Host "  -> Docker e' operativo." -ForegroundColor DarkGray
}

# 3. Supabase Start
Write-Host ""
Write-Host "[3/6] Avvio Supabase..." -ForegroundColor Yellow
Write-Host "  -> Arresto forzato istanze precedenti..." -ForegroundColor Gray
supabase stop --force >$null 2>&1
$supabaseResult = supabase start
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERRORE: Supabase non e' riuscito ad avviarsi." -ForegroundColor Red
    Write-Host "  Provando un arresto più aggressivo dei container..." -ForegroundColor Gray
    docker ps -q --filter "name=supabase" | ForEach-Object { docker stop $_; docker rm $_ }
    $supabaseResult = supabase start
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERRORE CRITICO: Supabase non si avvia nemmeno dopo il reset dei container." -ForegroundColor Red
        Read-Host "Premi INVIO per uscire..."
        exit
    }
}
Write-Host "  -> Supabase avviato correttamente." -ForegroundColor DarkGray

# 3.1 Set Supabase Secrets
Write-Host ""
Write-Host "[3.1/6] Configurazione segreti Supabase..." -ForegroundColor Yellow
if (Test-Path "supabase\.env") {
    $secrets = Get-Content "supabase\.env"
    foreach ($line in $secrets) {
        if ($line -match "^([^=]+)=(.+)$") {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim()
            supabase secrets set "$key=$val" --local >$null 2>&1
            Write-Host "  -> Segreto $key impostato." -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "  ATTENZIONE: File supabase\.env non trovato. Le funzioni potrebbero non funzionare." -ForegroundColor DarkGray
}
Write-Host ""
Write-Host "[4/6] Avvio Backend (Porta 3001)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/c title VeloTime-Backend && node `"$backendFile`"" -WindowStyle Normal
Write-Host "  -> Backend avviato in una nuova finestra." -ForegroundColor DarkGray

# 5. Frontend Start
Write-Host ""
Write-Host "[5/6] Avvio Frontend (Porta 5173)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/c title VeloTime-Frontend && cd /d `"$frontendDir`" && npm run dev" -WindowStyle Normal
Write-Host "  -> Frontend avviato in una nuova finestra." -ForegroundColor DarkGray

# 6. Browser Open
Write-Host ""
Write-Host "[6/6] Apertura browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  VeloTime pronto! Buon lavoro." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Premi INVIO per chiudere questa finestra di controllo..."
