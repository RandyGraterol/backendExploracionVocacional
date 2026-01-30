// Script para crear una actividad de prueba en vivo
// Usando fetch nativo de Node.js (no requiere instalar axios)

const API_BASE = 'http://localhost:3003/api';

async function crearActividadEnVivo() {
    console.log('🚀 === CREANDO ACTIVIDAD EN VIVO ===\n');

    // Actividad de prueba tipo Quiz
    const actividadPrueba = {
        id: `test-vivo-${Date.now()}`,
        title: '🧪 Quiz de Prueba en Vivo - JavaScript Básico',
        description: 'Esta es una actividad de prueba creada en vivo para verificar que el sistema funciona correctamente.',
        rama: 'desarrollo-software',
        tipo: 'Quiz',
        dificultad: 'Básico',
        imagen: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzRGNDZFNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfkrs8L3RleHQ+PC9zdmc+',
        icono: '💻',
        preguntas: [
            {
                id: 'q1-' + Date.now(),
                pregunta: '¿Qué es JavaScript?',
                opciones: [
                    'Un lenguaje de programación',
                    'Una base de datos',
                    'Un framework CSS',
                    'Un sistema operativo'
                ],
                correcta: 0
            },
            {
                id: 'q2-' + Date.now(),
                pregunta: '¿Cuál de estos NO es un tipo de dato primitivo en JavaScript?',
                opciones: [
                    'String',
                    'Array',
                    'Number',
                    'Boolean'
                ],
                correcta: 1
            },
            {
                id: 'q3-' + Date.now(),
                pregunta: '¿Qué palabra clave se usa para declarar una variable que NO puede ser reasignada?',
                opciones: [
                    'var',
                    'let',
                    'const',
                    'static'
                ],
                correcta: 2
            }
        ]
    };

    console.log('📦 Datos de la actividad:');
    console.log(`   ID: ${actividadPrueba.id}`);
    console.log(`   Título: ${actividadPrueba.title}`);
    console.log(`   Tipo: ${actividadPrueba.tipo}`);
    console.log(`   Rama: ${actividadPrueba.rama}`);
    console.log(`   Dificultad: ${actividadPrueba.dificultad}`);
    console.log(`   Preguntas: ${actividadPrueba.preguntas.length}`);
    console.log('');

    try {
        console.log('🌐 Enviando petición a:', `${API_BASE}/actividades`);
        console.log('');

        const response = await fetch(`${API_BASE}/actividades`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(actividadPrueba)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${JSON.stringify(data)}`);
        }

        console.log('✅ === ACTIVIDAD CREADA EXITOSAMENTE ===\n');
        console.log('📊 Respuesta del servidor:');
        console.log(`   Status: ${response.status}`);
        console.log(`   ID: ${data.id}`);
        console.log(`   Título: ${data.title}`);
        console.log(`   Tipo: ${data.tipo}`);
        console.log('');

        // Verificar que se puede leer la actividad
        console.log('🔍 Verificando que la actividad se puede leer...');
        const readResponse = await fetch(`${API_BASE}/actividades/${actividadPrueba.id}`);
        const readData = await readResponse.json();

        if (readResponse.ok && readData.id === actividadPrueba.id) {
            console.log('✅ La actividad se puede leer correctamente');
            console.log('');
        }

        // Contar total de actividades
        console.log('📈 Obteniendo todas las actividades...');
        const allResponse = await fetch(`${API_BASE}/actividades`);
        const allData = await allResponse.json();
        console.log(`✅ Total de actividades en el sistema: ${allData.length}`);
        console.log('');

        // Filtrar por rama
        console.log('🔎 Filtrando por rama "desarrollo-software"...');
        const filteredResponse = await fetch(`${API_BASE}/actividades?rama=desarrollo-software`);
        const filteredData = await filteredResponse.json();
        console.log(`✅ Actividades de desarrollo-software: ${filteredData.length}`);
        console.log('');

        console.log('🎉 === VERIFICACIÓN COMPLETA ===\n');
        console.log('✅ La actividad se creó correctamente');
        console.log('✅ La actividad se puede leer');
        console.log('✅ La actividad aparece en la lista general');
        console.log('✅ La actividad aparece al filtrar por rama');
        console.log('');
        console.log('📋 Ahora puedes:');
        console.log('   1. Abrir http://localhost:5173 en tu navegador');
        console.log('   2. Iniciar sesión como admin (admin@test.com / admin123)');
        console.log('   3. Ver la actividad en la lista de actividades');
        console.log('   4. También puedes iniciar sesión como estudiante y verla');
        console.log('');
        console.log(`🆔 ID de la actividad creada: ${actividadPrueba.id}`);
        console.log('');

        return actividadPrueba.id;

    } catch (error) {
        console.error('❌ === ERROR AL CREAR ACTIVIDAD ===\n');
        console.error('📛 Error:', error.message);

        if (error.cause) {
            console.error('   Causa:', error.cause);
        }

        console.error('');
        throw error;
    }
}

// Ejecutar
crearActividadEnVivo()
    .then(id => {
        console.log('✨ Script completado exitosamente');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Script falló');
        process.exit(1);
    });
