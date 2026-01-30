# Script de Diagnóstico Rápido - PowerShell
Write-Host "🔍 === DIAGNÓSTICO DEL SISTEMA DE ACTIVIDADES ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar base de datos
$dbPath = Join-Path $PSScriptRoot "database.sqlite"
Write-Host "📊 Base de Datos:" -ForegroundColor Yellow
Write-Host "   Ruta: $dbPath"

if (Test-Path $dbPath) {
    $size = (Get-Item $dbPath).Length
    Write-Host "   ✅ Existe (Tamaño: $([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "   ❌ NO EXISTE - La base de datos se creará al iniciar el backend" -ForegroundColor Red
}

# 2. Verificar puerto del backend
Write-Host ""
Write-Host "🌐 Configuración del Backend:" -ForegroundColor Yellow

$appPath = Join-Path $PSScriptRoot "src\app.ts"
if (Test-Path $appPath) {
    $content = Get-Content $appPath -Raw
    if ($content -match 'PORT.*?(\d+)') {
        Write-Host "   🔌 Puerto configurado: $($matches[1])" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Puerto no encontrado, por defecto 3003" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ app.ts no encontrado" -ForegroundColor Red
}

# 3. Verificar rutas
$routesPath = Join-Path $PSScriptRoot "src\routes\actividades.ts"
if (Test-Path $routesPath) {
    Write-Host "   ✅ Rutas de actividades configuradas" -ForegroundColor Green
} else {
    Write-Host "   ❌ Rutas de actividades NO encontradas" -ForegroundColor Red
}

# 4. Verificar controlador
$controllerPath = Join-Path $PSScriptRoot "src\controllers\actividadesController.ts"
if (Test-Path $controllerPath) {
    Write-Host "   ✅ Controlador de actividades encontrado" -ForegroundColor Green
    $controllerContent = Get-Content $controllerPath -Raw
    if ($controllerContent -match '=== INICIO CREACIÓN DE ACTIVIDAD ===') {
        Write-Host "      ✅ Logs de debugging activados" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Controlador de actividades NO encontrado" -ForegroundColor Red
}

# 5. Verificar frontend
Write-Host ""
Write-Host "💻 Configuración del Frontend:" -ForegroundColor Yellow

$frontendPath = Join-Path (Split-Path $PSScriptRoot -Parent) "frontend"
if (Test-Path $frontendPath) {
    Write-Host "   ✅ Directorio frontend encontrado" -ForegroundColor Green
    
    $envPath = Join-Path $frontendPath ".env.local"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath -Raw
        if ($envContent -match 'VITE_API_URL=(.*)') {
            Write-Host "   🌐 API URL: $($matches[1])" -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠️ .env.local no encontrado" -ForegroundColor Yellow
        Write-Host "      ℹ️ Por defecto usa: http://localhost:3003/api" -ForegroundColor Cyan
    }
    
    $contextPath = Join-Path $frontendPath "src\contexts\ActividadesContext.tsx"
    if (Test-Path $contextPath) {
        Write-Host "   ✅ ActividadesContext encontrado" -ForegroundColor Green
        $contextContent = Get-Content $contextPath -Raw
        if ($contextContent -match '=== GUARDANDO ACTIVIDAD') {
            Write-Host "      ✅ Logs de debugging activados" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ❌ Directorio frontend NO encontrado" -ForegroundColor Red
}

# 6. Verificar node_modules
Write-Host ""
Write-Host "📦 Dependencias:" -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules instalados" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules NO encontrado - Ejecuta: npm install" -ForegroundColor Red
}

# Resumen
Write-Host ""
Write-Host "📝 === RESUMEN Y PRÓXIMOS PASOS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar el sistema:" -ForegroundColor Yellow
Write-Host "   1. Terminal 1: cd backendExploracionVocacional" -ForegroundColor White
Write-Host "                 npm run dev" -ForegroundColor White
Write-Host "   2. Terminal 2: cd frontend" -ForegroundColor White
Write-Host "                 npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Para ejecutar tests:" -ForegroundColor Yellow
Write-Host "   cd backendExploracionVocacional" -ForegroundColor White
Write-Host "   npm test" -ForegroundColor White
Write-Host ""
Write-Host "Para ver logs detallados:" -ForegroundColor Yellow
Write-Host "   Frontend: Abre DevTools (F12) -> Console" -ForegroundColor White
Write-Host "   Backend: Revisa la terminal donde corre npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Cuando crees una actividad desde el admin, verás logs como:" -ForegroundColor Yellow
Write-Host "   🟢 === GUARDANDO ACTIVIDAD (FRONTEND) ===" -ForegroundColor Green
Write-Host "   🔵 === INICIO CREACIÓN DE ACTIVIDAD ===" -ForegroundColor Cyan
Write-Host ""
