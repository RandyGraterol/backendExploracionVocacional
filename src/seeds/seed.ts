import { sequelize, PreguntaVocacional, OpcionVocacional, PreguntaConocimiento, OpcionConocimiento, Usuario, Rama, Actividad } from '../models';
import crypto from 'crypto';

// Hash simple para passwords
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Usuario administrador predeterminado
const adminUser = {
  nombre: 'Administrador',
  apellido: 'Sistema',
  email: 'admin@sistema.com',
  password: 'admin123',
  rol: 'admin' as const
};

// Datos de ramas
const ramasData = [
  {
    id: "desarrollo",
    titulo: "Desarrollo de Software",
    descripcion: "El desarrollo de software es el proceso de crear, diseñar, programar y mantener aplicaciones y sistemas informáticos.",
    icono: "💻",
    tecnologias: ["JavaScript", "Python", "Java", "C#", "TypeScript", "React", "Angular", "Node.js", "Git"],
    aplicaciones: ["Aplicaciones web y móviles", "Software empresarial", "Videojuegos", "APIs y microservicios"],
    imagenes: ["/programacion.jpeg", "/programacion2.jpeg"],
    videos: []
  },
  {
    id: "redes",
    titulo: "Redes",
    descripcion: "Las redes de computadoras permiten la comunicación y el intercambio de información entre dispositivos.",
    icono: "🌐",
    tecnologias: ["TCP/IP", "DNS", "HTTP/HTTPS", "VPN", "Cisco", "Wireshark", "Linux"],
    aplicaciones: ["Redes corporativas", "Cloud computing", "IoT", "Comunicaciones unificadas"],
    imagenes: ["/redes.jpeg"],
    videos: []
  },
  {
    id: "ciberseguridad",
    titulo: "Ciberseguridad",
    descripcion: "La ciberseguridad se enfoca en proteger sistemas, redes y datos contra ataques digitales.",
    icono: "🔒",
    tecnologias: ["Kali Linux", "Metasploit", "Wireshark", "Nmap", "Firewalls", "Cryptography"],
    aplicaciones: ["Ethical hacking", "Análisis forense", "Auditorías de seguridad", "Gestión de identidades"],
    imagenes: ["/cyberSeguridad.jpeg", "/cyberSeguridad2.jpeg", "/cyberSeguridad3.jpeg"],
    videos: []
  },
  {
    id: "bases-datos",
    titulo: "Bases de Datos",
    descripcion: "Las bases de datos son sistemas organizados para almacenar, gestionar y recuperar información.",
    icono: "🗄️",
    tecnologias: ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Oracle", "Redis"],
    aplicaciones: ["Sistemas empresariales", "E-commerce", "Big Data", "Data warehousing"],
    imagenes: ["/baseDatos.jpeg", "/baseDatos2.jpeg", "/baseDatos3.jpeg"],
    videos: []
  },
  {
    id: "robotica",
    titulo: "Robótica",
    descripcion: "La robótica combina ingeniería mecánica, electrónica y programación para crear máquinas autónomas.",
    icono: "🤖",
    tecnologias: ["Arduino", "Raspberry Pi", "ROS", "C++", "Python", "MATLAB", "Sensores IoT"],
    aplicaciones: ["Automatización industrial", "Robots médicos", "Drones", "Agricultura de precisión"],
    imagenes: [],
    videos: []
  },
  {
    id: "ia",
    titulo: "Inteligencia Artificial",
    descripcion: "La IA permite a las máquinas aprender, razonar y tomar decisiones similares a las humanas.",
    icono: "🧠",
    tecnologias: ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Keras", "OpenCV", "NLP"],
    aplicaciones: ["Asistentes virtuales", "Reconocimiento facial", "Sistemas de recomendación", "Diagnóstico médico"],
    imagenes: ["/inteligenciaArtificial.jpeg", "/inteligenciaArtificial2.jpeg", "/inteligenciaArtificial3.jpeg"],
    videos: []
  }
];

// Datos de actividades
const actividadesData = [
  {
    id: 'quiz-ciberseguridad-1',
    title: 'Quiz de Ciberseguridad',
    description: 'Pon a prueba tus conocimientos sobre seguridad informática',
    rama: 'ciberseguridad',
    tipo: 'Quiz',
    dificultad: 'Intermedio',
    imagen: '/cyberSeguridad.jpeg',
    icono: '🛡️',
    preguntas: [
      { id: 'q1', pregunta: '¿Qué es el phishing?', opciones: ['Un tipo de virus', 'Un ataque que roba información mediante correos falsos', 'Un programa antivirus', 'Una técnica de encriptación'], correcta: 1 },
      { id: 'q2', pregunta: '¿Cuál es el propósito principal de un firewall?', opciones: ['Acelerar la conexión', 'Bloquear accesos no autorizados', 'Guardar contraseñas', 'Crear copias de seguridad'], correcta: 1 },
      { id: 'q3', pregunta: '¿Qué significa 2FA?', opciones: ['Usar dos contraseñas', 'Confirmar identidad con contraseña y otro medio', 'Tener dos cuentas', 'Usar dos navegadores'], correcta: 1 },
      { id: 'q4', pregunta: '¿Qué es un malware?', opciones: ['Un programa de seguridad', 'Software malicioso', 'Un tipo de red', 'Una técnica de programación'], correcta: 1 },
      { id: 'q5', pregunta: '¿Cuál es una característica de una contraseña segura?', opciones: ['Usar solo números', 'Usar tu fecha de nacimiento', 'Combinar letras, números y símbolos', 'Usar palabras comunes'], correcta: 2 }
    ]
  },
  {
    id: 'quiz-basedatos-1',
    title: 'Quiz de Bases de Datos',
    description: 'Evalúa tus conocimientos sobre gestión de datos',
    rama: 'bases-datos',
    tipo: 'Quiz',
    dificultad: 'Intermedio',
    imagen: '/baseDatos.jpeg',
    icono: '🗄️',
    preguntas: [
      { id: 'q1', pregunta: '¿Qué significa SQL?', opciones: ['System Quality Language', 'Structured Query Language', 'Secure Query Level', 'System Quick Log'], correcta: 1 },
      { id: 'q2', pregunta: '¿Qué tipo de BD organiza información en tablas relacionadas?', opciones: ['NoSQL', 'Relacionales', 'Documentales', 'Planas'], correcta: 1 },
      { id: 'q3', pregunta: '¿Cuál es la función de una clave primaria?', opciones: ['Encriptar datos', 'Identificar de forma única cada registro', 'Ordenar los datos', 'Eliminar duplicados'], correcta: 1 },
      { id: 'q4', pregunta: '¿Qué comando SQL se usa para recuperar datos?', opciones: ['GET', 'FETCH', 'SELECT', 'RETRIEVE'], correcta: 2 },
      { id: 'q5', pregunta: '¿Qué es una base de datos NoSQL?', opciones: ['Una BD sin lenguaje', 'Una BD que no usa tablas relacionales', 'Una BD obsoleta', 'Una BD solo para números'], correcta: 1 }
    ]
  },
  {
    id: 'quiz-ia-1',
    title: 'Quiz de Inteligencia Artificial',
    description: 'Descubre cuánto sabes sobre IA y Machine Learning',
    rama: 'ia',
    tipo: 'Quiz',
    dificultad: 'Avanzado',
    imagen: '/inteligenciaArtificial.jpeg',
    icono: '🧠',
    preguntas: [
      { id: 'q1', pregunta: '¿Qué es la inteligencia artificial?', opciones: ['Un programa para chatear', 'La capacidad de las máquinas para aprender y decidir', 'Un software para fotos', 'Una base de datos'], correcta: 1 },
      { id: 'q2', pregunta: '¿Qué técnica permite que una máquina aprenda de datos?', opciones: ['Networking', 'Machine Learning', 'Minería', 'Ingeniería de software'], correcta: 1 },
      { id: 'q3', pregunta: '¿Qué es un algoritmo de clasificación?', opciones: ['Un método para ordenar archivos', 'Un algoritmo que categoriza datos', 'Un tipo de BD', 'Un lenguaje'], correcta: 1 },
      { id: 'q4', pregunta: '¿Qué son las redes neuronales?', opciones: ['Cables de internet', 'Modelos inspirados en el cerebro humano', 'Redes sociales', 'Sistemas operativos'], correcta: 1 },
      { id: 'q5', pregunta: '¿Qué es NLP?', opciones: ['Un lenguaje de programación', 'La capacidad de entender lenguaje humano', 'Un tipo de red', 'Un sistema operativo'], correcta: 1 }
    ]
  },
  {
    id: 'quiz-desarrollo-web-1',
    title: 'Quiz de Desarrollo Web',
    description: 'Evalúa tus conocimientos sobre tecnologías web',
    rama: 'desarrollo',
    tipo: 'Quiz',
    dificultad: 'Básico',
    imagen: '/programacion.jpeg',
    icono: '🌐',
    preguntas: [
      { id: 'q1', pregunta: '¿Qué significa HTML?', opciones: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'], correcta: 0 },
      { id: 'q2', pregunta: '¿Cuál es la función principal de CSS?', opciones: ['Crear bases de datos', 'Dar estilo a páginas web', 'Programar el servidor', 'Gestionar usuarios'], correcta: 1 },
      { id: 'q3', pregunta: '¿Qué lenguaje se ejecuta en el navegador?', opciones: ['Python', 'Java', 'JavaScript', 'C++'], correcta: 2 },
      { id: 'q4', pregunta: '¿Qué es el DOM?', opciones: ['Un lenguaje', 'Representación de la estructura HTML', 'Un tipo de BD', 'Un servidor web'], correcta: 1 },
      { id: 'q5', pregunta: '¿Qué framework de JS es popular para interfaces?', opciones: ['Django', 'Flask', 'React', 'Laravel'], correcta: 2 }
    ]
  },
  {
    id: 'ordenamiento-algoritmo-1',
    title: 'Ordenar Pasos de un Algoritmo',
    description: 'Ordena correctamente los pasos para crear un algoritmo de búsqueda',
    rama: 'desarrollo',
    tipo: 'Ordenamiento',
    dificultad: 'Intermedio',
    imagen: '/programacion2.jpeg',
    icono: '📋',
    itemsOrden: [
      { id: 'paso1', texto: 'Definir el problema y los datos de entrada', ordenCorrecto: 1 },
      { id: 'paso2', texto: 'Inicializar las variables necesarias', ordenCorrecto: 2 },
      { id: 'paso3', texto: 'Recorrer la estructura de datos', ordenCorrecto: 3 },
      { id: 'paso4', texto: 'Comparar cada elemento con el valor buscado', ordenCorrecto: 4 },
      { id: 'paso5', texto: 'Retornar el resultado encontrado', ordenCorrecto: 5 }
    ]
  },
  {
    id: 'simulador-red-lan-1',
    title: 'Simulador de Red LAN',
    description: 'Conecta correctamente los dispositivos para crear una red local',
    rama: 'redes',
    tipo: 'Simulación',
    dificultad: 'Intermedio',
    imagen: '/redes.jpeg',
    icono: '🌐',
    simulacion: {
      dispositivos: [
        { id: 'pc1', tipo: 'computadora', nombre: 'PC 1' },
        { id: 'pc2', tipo: 'computadora', nombre: 'PC 2' },
        { id: 'pc3', tipo: 'computadora', nombre: 'PC 3' },
        { id: 'switch1', tipo: 'switch', nombre: 'Switch Central' },
        { id: 'router1', tipo: 'router', nombre: 'Router Principal' },
        { id: 'servidor1', tipo: 'servidor', nombre: 'Servidor' }
      ],
      conexionesCorrectas: [
        { dispositivo1: 'pc1', dispositivo2: 'switch1' },
        { dispositivo1: 'pc2', dispositivo2: 'switch1' },
        { dispositivo1: 'pc3', dispositivo2: 'switch1' },
        { dispositivo1: 'switch1', dispositivo2: 'router1' },
        { dispositivo1: 'servidor1', dispositivo2: 'router1' }
      ],
      objetivos: ['Conectar todas las PCs al switch', 'Conectar el switch al router', 'Conectar el servidor al router']
    }
  },
  {
    id: 'desafio-hardware-1',
    title: 'Identificar Componentes de Hardware',
    description: 'Relaciona cada componente con su función correcta',
    rama: 'desarrollo',
    tipo: 'Desafío',
    dificultad: 'Básico',
    imagen: '/programacion.jpeg',
    icono: '💻',
    paresDesafio: [
      { id: 'par1', concepto: 'CPU', definicion: 'Procesador central que ejecuta instrucciones' },
      { id: 'par2', concepto: 'RAM', definicion: 'Memoria temporal de acceso rápido' },
      { id: 'par3', concepto: 'Disco Duro', definicion: 'Almacenamiento permanente de datos' },
      { id: 'par4', concepto: 'Tarjeta Gráfica', definicion: 'Procesa y renderiza imágenes y video' },
      { id: 'par5', concepto: 'Placa Madre', definicion: 'Conecta todos los componentes del sistema' },
      { id: 'par6', concepto: 'Fuente de Poder', definicion: 'Suministra energía eléctrica al sistema' }
    ]
  }
];

// Datos de preguntas vocacionales
const preguntasVocacionales = [
  {
    pregunta: "¿Qué te gusta hacer en tu tiempo libre?",
    opciones: [
      { texto: "Programar y crear aplicaciones", rama: "desarrollo" },
      { texto: "Configurar redes y servidores", rama: "redes" },
      { texto: "Investigar sobre seguridad informática", rama: "ciberseguridad" },
      { texto: "Trabajar con bases de datos", rama: "bases-datos" },
      { texto: "Construir robots o dispositivos electrónicos", rama: "robotica" },
      { texto: "Experimentar con inteligencia artificial", rama: "ia" }
    ]
  },
  {
    pregunta: "¿Qué tipo de problemas prefieres resolver?",
    opciones: [
      { texto: "Crear soluciones de software innovadoras", rama: "desarrollo" },
      { texto: "Optimizar la comunicación entre sistemas", rama: "redes" },
      { texto: "Proteger sistemas contra amenazas", rama: "ciberseguridad" },
      { texto: "Organizar y gestionar información", rama: "bases-datos" },
      { texto: "Automatizar procesos físicos", rama: "robotica" },
      { texto: "Enseñar a las máquinas a aprender", rama: "ia" }
    ]
  },
  {
    pregunta: "¿Qué herramienta te gustaría dominar?",
    opciones: [
      { texto: "Frameworks de desarrollo web/móvil", rama: "desarrollo" },
      { texto: "Equipos de networking (routers, switches)", rama: "redes" },
      { texto: "Herramientas de pentesting y análisis", rama: "ciberseguridad" },
      { texto: "Sistemas de gestión de bases de datos", rama: "bases-datos" },
      { texto: "Arduino, Raspberry Pi y sensores", rama: "robotica" },
      { texto: "TensorFlow, PyTorch y machine learning", rama: "ia" }
    ]
  },
  {
    pregunta: "¿En qué entorno te gustaría trabajar?",
    opciones: [
      { texto: "Startups tecnológicas o empresas de software", rama: "desarrollo" },
      { texto: "Centros de datos o proveedores de internet", rama: "redes" },
      { texto: "Equipos de seguridad o consultoría", rama: "ciberseguridad" },
      { texto: "Empresas con grandes volúmenes de datos", rama: "bases-datos" },
      { texto: "Industrias de manufactura o investigación", rama: "robotica" },
      { texto: "Laboratorios de IA o tech companies", rama: "ia" }
    ]
  },
  {
    pregunta: "¿Qué te motiva más?",
    opciones: [
      { texto: "Ver mis aplicaciones usadas por miles", rama: "desarrollo" },
      { texto: "Mantener sistemas conectados 24/7", rama: "redes" },
      { texto: "Prevenir ataques y proteger información", rama: "ciberseguridad" },
      { texto: "Transformar datos en insights valiosos", rama: "bases-datos" },
      { texto: "Ver robots hacer tareas complejas", rama: "robotica" },
      { texto: "Crear sistemas que piensan y aprenden", rama: "ia" }
    ]
  }
];

// Datos de preguntas de conocimiento (18 preguntas)
const preguntasConocimiento = [
  // Desarrollo de Software (3)
  { pregunta: "¿Qué lenguaje es popular para aplicaciones móviles Android?", rama: "desarrollo", correcta: 1, opciones: [{ texto: "C#", indice: 0 }, { texto: "Java", indice: 1 }, { texto: "SQL", indice: 2 }, { texto: "PHP", indice: 3 }] },
  { pregunta: "¿Qué significa el concepto de frontend en el desarrollo de software?", rama: "desarrollo", correcta: 0, opciones: [{ texto: "La parte visual que interactúa con el usuario", indice: 0 }, { texto: "El almacenamiento de datos", indice: 1 }, { texto: "La seguridad del sistema", indice: 2 }, { texto: "El hardware del equipo", indice: 3 }] },
  { pregunta: "¿Qué metodología busca entregas rápidas y trabajo en equipo?", rama: "desarrollo", correcta: 1, opciones: [{ texto: "Cascada", indice: 0 }, { texto: "Ágil", indice: 1 }, { texto: "Prototipado", indice: 2 }, { texto: "Manual", indice: 3 }] },
  // Redes (3)
  { pregunta: "¿Qué dispositivo se usa para conectar varios equipos en una red local?", rama: "redes", correcta: 1, opciones: [{ texto: "Router", indice: 0 }, { texto: "Switch", indice: 1 }, { texto: "Firewall", indice: 2 }, { texto: "Servidor", indice: 3 }] },
  { pregunta: "¿Cuál es la dirección que identifica un dispositivo en internet?", rama: "redes", correcta: 1, opciones: [{ texto: "Contraseña", indice: 0 }, { texto: "IP", indice: 1 }, { texto: "URL", indice: 2 }, { texto: "DNS", indice: 3 }] },
  { pregunta: "¿Qué protocolo se usa para enviar correos electrónicos?", rama: "redes", correcta: 2, opciones: [{ texto: "HTTP", indice: 0 }, { texto: "FTP", indice: 1 }, { texto: "SMTP", indice: 2 }, { texto: "DNS", indice: 3 }] },
  // Ciberseguridad (3)
  { pregunta: "¿Qué significa el término phishing?", rama: "ciberseguridad", correcta: 0, opciones: [{ texto: "Ataque que roba contraseñas y datos mediante correos falsos", indice: 0 }, { texto: "Método para acelerar la red", indice: 1 }, { texto: "Programa que limpia virus", indice: 2 }, { texto: "Software de respaldo", indice: 3 }] },
  { pregunta: "¿Qué es un antivirus?", rama: "ciberseguridad", correcta: 1, opciones: [{ texto: "Programa que diseña sitios web", indice: 0 }, { texto: "Software que protege contra malware", indice: 1 }, { texto: "Red interna", indice: 2 }, { texto: "Lenguaje de programación", indice: 3 }] },
  { pregunta: "¿Qué significa tener la autenticación en dos pasos?", rama: "ciberseguridad", correcta: 2, opciones: [{ texto: "Dos usuarios usan la misma cuenta", indice: 0 }, { texto: "Escribir la contraseña dos veces", indice: 1 }, { texto: "Confirmar identidad con contraseña y otro medio extra", indice: 2 }, { texto: "Un programa automático crea la clave", indice: 3 }] },
  // Bases de Datos (3)
  { pregunta: "¿Qué significa SQL?", rama: "bases-datos", correcta: 1, opciones: [{ texto: "System Quality Language", indice: 0 }, { texto: "Structured Query Language", indice: 1 }, { texto: "Secure Query Level", indice: 2 }, { texto: "System Quick Log", indice: 3 }] },
  { pregunta: "¿Qué tipo de bases de datos se usa cuando la información se organiza en tablas relacionadas?", rama: "bases-datos", correcta: 0, opciones: [{ texto: "Relacionales", indice: 0 }, { texto: "Planas", indice: 1 }, { texto: "Documentales", indice: 2 }, { texto: "NoSQL", indice: 3 }] },
  { pregunta: "¿Qué sistema gestor de bases de datos es muy popular?", rama: "bases-datos", correcta: 0, opciones: [{ texto: "MySQL", indice: 0 }, { texto: "Paint", indice: 1 }, { texto: "Excel", indice: 2 }, { texto: "Photoshop", indice: 3 }] },
  // Robótica (3)
  { pregunta: "¿Qué elementos principales se combinan en la robótica?", rama: "robotica", correcta: 1, opciones: [{ texto: "Medicina y biología", indice: 0 }, { texto: "Mecánica, electrónica e informática", indice: 1 }, { texto: "Química y física", indice: 2 }, { texto: "Arte y diseño", indice: 3 }] },
  { pregunta: "¿Qué tipo de robot se usa en fábricas para armar autos?", rama: "robotica", correcta: 1, opciones: [{ texto: "Doméstico", indice: 0 }, { texto: "Industrial", indice: 1 }, { texto: "Social", indice: 2 }, { texto: "Educativo", indice: 3 }] },
  { pregunta: "¿Cuál de estos lenguajes se usa en programación de robots?", rama: "robotica", correcta: 0, opciones: [{ texto: "Python", indice: 0 }, { texto: "Excel", indice: 1 }, { texto: "Word", indice: 2 }, { texto: "PowerPoint", indice: 3 }] },
  // Inteligencia Artificial (3)
  { pregunta: "¿Qué es la inteligencia artificial?", rama: "ia", correcta: 1, opciones: [{ texto: "Un programa para chatear", indice: 0 }, { texto: "La capacidad de las máquinas para aprender y tomar decisiones", indice: 1 }, { texto: "Un software para guardar fotos", indice: 2 }, { texto: "Una base de datos de contraseñas", indice: 3 }] },
  { pregunta: "¿Qué tipo de IA se usa en asistentes como Siri o Alexa?", rama: "ia", correcta: 1, opciones: [{ texto: "IA fuerte", indice: 0 }, { texto: "IA débil", indice: 1 }, { texto: "IA cuántica", indice: 2 }, { texto: "IA emocional", indice: 3 }] },
  { pregunta: "¿Qué técnica de IA se usa para que una máquina aprenda de datos?", rama: "ia", correcta: 0, opciones: [{ texto: "Machine Learning", indice: 0 }, { texto: "Minería", indice: 1 }, { texto: "Ingeniería de software", indice: 2 }, { texto: "Networking", indice: 3 }] }
];

async function seed() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');
    
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');
    
    await sequelize.sync({ force: true });
    console.log('✅ Tablas recreadas');
    
    // Usuario administrador
    await Usuario.create({
      nombre: adminUser.nombre,
      apellido: adminUser.apellido,
      email: adminUser.email,
      password: hashPassword(adminUser.password),
      rol: adminUser.rol,
      activo: true,
      estado: 'aprobado' // Admin siempre aprobado
    });
    console.log('✅ Usuario administrador creado');
    
    // Ramas
    for (const rama of ramasData) {
      await Rama.create(rama);
    }
    console.log(`✅ ${ramasData.length} ramas insertadas`);
    
    // Actividades
    for (const actividad of actividadesData) {
      await Actividad.create(actividad);
    }
    console.log(`✅ ${actividadesData.length} actividades insertadas`);
    
    // Preguntas vocacionales
    for (const preguntaData of preguntasVocacionales) {
      const pregunta = await PreguntaVocacional.create({ pregunta: preguntaData.pregunta });
      for (const opcionData of preguntaData.opciones) {
        await OpcionVocacional.create({ preguntaId: pregunta.id, texto: opcionData.texto, rama: opcionData.rama });
      }
    }
    console.log(`✅ ${preguntasVocacionales.length} preguntas vocacionales insertadas`);
    
    // Preguntas de conocimiento
    for (const preguntaData of preguntasConocimiento) {
      const pregunta = await PreguntaConocimiento.create({ pregunta: preguntaData.pregunta, rama: preguntaData.rama, correcta: preguntaData.correcta });
      for (const opcionData of preguntaData.opciones) {
        await OpcionConocimiento.create({ preguntaId: pregunta.id, texto: opcionData.texto, indice: opcionData.indice });
      }
    }
    console.log(`✅ ${preguntasConocimiento.length} preguntas de conocimiento insertadas`);
    
    console.log('\n🎉 Seed completado exitosamente!');
    console.log(`📋 Credenciales admin: ${adminUser.email} / ${adminUser.password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

seed();
