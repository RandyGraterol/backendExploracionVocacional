/**
 * Script de Diagnóstico Rápido
 * Ejecutar: node diagnose.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 === DIAGNÓSTICO DEL SISTEMA DE ACTIVIDADES ===\n');

// 1. Verificar base de datos
const dbPath = path.join(__dirname, 'database.sqlite');
console.log('📊 Base de Datos:');
console.log(`   Ruta: ${dbPath}`);

if (fs.existsSync(dbPath)) {
    console.log('   ✅ Existe');

    const db = new sqlite3.Database(dbPath);

    db.get("SELECT COUNT(*) as count FROM actividades", (err, row) => {
        if (err) {
            console.log('   ❌ Error al consultar:', err.message);
        } else {
            console.log(`   📈 Total actividades: ${row.count}`);
        }

        // Mostrar últimas 5 actividades
        db.all("SELECT id, title, tipo, rama FROM actividades ORDER BY id DESC LIMIT 5", (err, rows) => {
            if (err) {
                console.log('   ❌ Error al listar:', err.message);
            } else {
                if (rows.length > 0) {
                    console.log('\n   📋 Últimas 5 actividades:');
                    rows.forEach((row, i) => {
                        console.log(`      ${i + 1}. ${row.title} (${row.tipo}) - ${row.rama}`);
                    });
                } else {
                    console.log('\n   ⚠️ No hay actividades en la base de datos');
                }
            }

            db.close();
            checkPort();
        });
    });
} else {
    console.log('   ❌ NO EXISTE - La base de datos se creará al iniciar el backend');
    checkPort();
}

function checkPort() {
    // 2. Verificar puerto del backend
    console.log('\n🌐 Configuración del Backend:');

    const appPath = path.join(__dirname, 'src', 'app.ts');
    if (fs.existsSync(appPath)) {
        const content = fs.readFileSync(appPath, 'utf-8');
        const portMatch = content.match(/PORT.*?(\d+)/);
        if (portMatch) {
            console.log(`   🔌 Puerto: ${portMatch[1]}`);
        } else {
            console.log('   ⚠️ Puerto no encontrado en app.ts, por defecto 3003');
        }
    }

    // 3. Verificar rutas
    const routesPath = path.join(__dirname, 'src', 'routes', 'actividades.ts');
    if (fs.existsSync(routesPath)) {
        console.log('   ✅ Rutas de actividades configuradas');
    } else {
        console.log('   ❌ Rutas de actividades NO encontradas');
    }

    checkFrontend();
}

function checkFrontend() {
    // 4. Verificar frontend
    console.log('\n💻 Configuración del Frontend:');

    const envPath = path.join(__dirname, '..', 'frontend', '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const apiUrl = content.match(/VITE_API_URL=(.*)/);
        if (apiUrl) {
            console.log(`   🌐 API URL: ${apiUrl[1]}`);
        }
    } else {
        console.log('   ⚠️ .env.local no encontrado');
        console.log('   ℹ️ Por defecto usa: http://localhost:3003/api');
    }

    const contextPath = path.join(__dirname, '..', 'frontend', 'src', 'contexts', 'ActividadesContext.tsx');
    if (fs.existsSync(contextPath)) {
        console.log('   ✅ ActividadesContext encontrado');
    } else {
        console.log('   ❌ ActividadesContext NO encontrado');
    }

    printSummary();
}

function printSummary() {
    console.log('\n📝 === RESUMEN ===');
    console.log('\nPara iniciar el sistema:');
    console.log('1. Terminal 1: cd backendExploracionVocacional && npm run dev');
    console.log('2. Terminal 2: cd frontend && npm run dev');
    console.log('\nPara ejecutar tests:');
    console.log('   cd backendExploracionVocacional && npm test');
    console.log('\nPara ver logs detallados:');
    console.log('   - Frontend: Abre DevTools (F12) -> Console');
    console.log('   - Backend: Revisa la terminal donde corre npm run dev');
    console.log('\n');
}
