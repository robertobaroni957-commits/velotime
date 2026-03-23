@echo off
title VeloTime - Clean Environment Start

echo ============================================
echo        VeloTime - Avvio Pulito
echo ============================================
echo.

REM --- 1) Chiude processi bloccati ---
echo [1/7] Terminazione processi Node, Deno, Supabase, Docker CLI...
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM deno.exe /F >nul 2>&1
taskkill /IM supabase.exe /F >nul 2>&1
taskkill /IM docker.exe /F >nul 2>&1
taskkill /IM docker-compose.exe /F >nul 2>&1
echo   -> Processi terminati
echo.

REM --- 2) Verifica che Docker Desktop sia attivo ---
echo [2/7] Verifica Docker Desktop...
docker version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo   ERRORE: Docker Desktop non e' avviato.
    echo   Avvialo manualmente e poi rilancia questo script.
    pause
    exit /b
)
echo   -> Docker e' attivo
echo.

REM --- 3) Reset variabili d'ambiente ---
echo [3/7] Reset variabili d'ambiente del progetto...
set VITE_STRAVA_CLIENT_ID=
set VITE_STRAVA_CLIENT_SECRET=
set VITE_STRAVA_REDIRECT_URI=
set SUPABASE_URL=
set SUPABASE_ANON_KEY=
set SUPABASE_SERVICE_ROLE_KEY=
echo   -> Variabili pulite
echo.

REM --- 4) Ricarica variabili da .env.local ---
echo [4/7] Caricamento variabili da .env.local...
if not exist ".env.local" (
    echo   ERRORE: .env.local non trovato.
    pause
    exit /b
)

for /f "usebackq tokens=1,2 delims==" %%a in (".env.local") do (
    set %%a=%%b
)
echo   -> Variabili caricate
echo.

REM --- 5) Avvio Supabase locale ---
echo [5/7] Avvio Supabase locale...
supabase stop >nul 2>&1
supabase start
IF %ERRORLEVEL% NEQ 0 (
    echo   ERRORE: Supabase non e' riuscito ad avviarsi.
    echo   Controlla eventuali porte occupate.
    pause
    exit /b
)
echo   -> Supabase avviato correttamente
echo.

REM --- 6) Avvio frontend ---
echo [6/7] Avvio frontend Vite...
cd frontend
start cmd /c "npm run dev"
cd ..
echo   -> Frontend avviato
echo.

REM --- 7) Apertura browser ---
echo [7/7] Apertura browser su http://localhost:5173 ...
start http://localhost:5173
echo.

echo ============================================
echo   Ambiente pulito e VeloTime avviato!
echo ============================================
pause
