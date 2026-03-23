@echo off
cd /d "C:\Progetti\Strava_Events\Velotime"

echo [1/6] Verifica Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRORE: Docker non e' avviato! Avvia Docker Desktop e riprova.
    pause
    exit /b
)

echo [2/6] Verifica Porte...
netstat -ano | findstr ":54321" >nul 2>&1
if %errorlevel% equ 0 (
    echo Porta 54321 occupata. Provo a fermare i container...
    cd VeloTimeApp
    call supabase stop
    cd ..
)

echo [3/6] Avvio Supabase...
cd VeloTimeApp
call supabase start
if %errorlevel% neq 0 (
    echo ERRORE: Impossibile avviare Supabase.
    pause
    exit /b
)

echo [3.1/6] Configurazione segreti...
:: Assicuriamoci che i segreti siano disponibili
echo Verifico la presenza del file .env...
if not exist "supabase\.env" (
    echo ATTENZIONE: File supabase/.env non trovato! Le funzioni Strava potrebbero fallire.
)

echo [4/6] Avvio Backend (Functions)...
start "Supabase Edge Functions" cmd /k "supabase functions serve --no-verify-jwt --env-file supabase/.env"

echo [5/6] Avvio Frontend...
cd frontend
start "Vite Frontend" cmd /k "npm run dev"

echo [6/6] Apertura browser...
timeout /t 5 >nul
start http://localhost:5173

echo.
echo ========================================================
echo   VELOTIME AVVIATO CORRETTAMENTE
echo   - Frontend: http://localhost:5173
echo   - Studio:   http://localhost:54323
echo   - API:      http://localhost:54321
echo ========================================================
echo   Non chiudere questa finestra.
echo ========================================================
pause
