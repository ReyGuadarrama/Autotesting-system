// Datos de los exámenes disponibles
// En un entorno de producción, estos datos podrían cargarse desde un archivo JSON externo
const availableExams = [
    {
        id: "physics-kinematics-1",
        title: "Cinemática Básica",
        description: "Conceptos fundamentales de movimiento, velocidad y aceleración.",
        subject: "physics",
        topic: "mechanics",
        subtopic: "kinematics",
        difficulty: "Intermedio",
        questions: 10,
        timeLimit: 600, // 10 minutos
        imagePath: "assets/physics-icon.png"
    },
    {
        id: "math-algebra-1",
        title: "Álgebra Lineal",
        description: "Ecuaciones lineales, sistemas de ecuaciones y matrices básicas.",
        subject: "math",
        topic: "algebra",
        subtopic: "linear",
        difficulty: "Intermedio",
        questions: 8,
        timeLimit: 480, // 8 minutos
        imagePath: "assets/math-icon.png"
    },
    {
        id: "physics-dynamics-1",
        title: "Dinámica y Fuerzas",
        description: "Leyes de Newton, fuerzas y equilibrio de cuerpos.",
        subject: "physics",
        topic: "mechanics",
        subtopic: "dynamics",
        difficulty: "Avanzado",
        questions: 12,
        timeLimit: 900, // 15 minutos
        imagePath: "assets/physics-icon.png"
    },
    {
        id: "math-calculus-1",
        title: "Cálculo Diferencial",
        description: "Límites, derivadas y aplicaciones básicas.",
        subject: "math",
        topic: "calculus",
        subtopic: "differential",
        difficulty: "Avanzado",
        questions: 10,
        timeLimit: 720, // 12 minutos
        imagePath: "assets/math-icon.png"
    }
];

/**
 * Carga los exámenes disponibles
 */
async function loadAvailableExams() {
    try {
        // Por ahora usamos los datos hardcodeados
        // En el futuro, esto cargará desde archivos JSON en data/exams/
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(availableExams);
            }, 500);
        });
    } catch (error) {
        console.error('Error cargando los exámenes disponibles:', error);
        return [];
    }
}

/**
 * Genera una tarjeta para un examen específico
 */
function createExamCard(exam) {
    const card = document.createElement('div');
    card.className = 'exam-card';
    
    // Formatear el tiempo límite adecuadamente
    const minutes = Math.floor(exam.timeLimit / 60);
    const seconds = exam.timeLimit % 60;
    const timeFormatted = minutes > 0 
        ? `${minutes} min${minutes > 1 ? 's' : ''}${seconds > 0 ? ` ${seconds} seg` : ''}`
        : `${seconds} segundos`;
    
    // Obtener el ícono según la asignatura
    const iconPath = exam.subject === 'physics' ? 'assets/physics-icon.png' : 'assets/math-icon.png';
    
    card.innerHTML = `
        <div class="exam-icon">
            <img src="${iconPath}" alt="${exam.title}" onerror="this.src='assets/exam-icon.png'">
        </div>
        <div class="exam-details">
            <h3>${exam.title}</h3>
            <p>${exam.description}</p>
            <div class="exam-meta">
                <span class="subject ${exam.subject}">${exam.subject === 'physics' ? 'Física' : 'Matemáticas'}</span>
                <span class="difficulty ${exam.difficulty.toLowerCase()}">${exam.difficulty}</span>
                <span class="questions-count">${exam.questions} preguntas</span>
                <span class="time-limit">${timeFormatted}</span>
            </div>
        </div>
        <div class="exam-actions">
            <button class="start-btn" data-exam-id="${exam.id}">Comenzar</button>
        </div>
    `;
    
    // Agregar evento para iniciar el examen
    const startButton = card.querySelector('.start-btn');
    startButton.addEventListener('click', () => startExam(exam.id));
    
    return card;
}

/**
 * Inicia el examen seleccionado
 */
function startExam(examId) {
    // Redirigir al simulador de examen con el ID seleccionado
    window.location.href = `examen.html?id=${examId}`;
}

/**
 * Filtra exámenes por asignatura
 */
function filterExamsBySubject(exams, subject) {
    if (subject === 'all') return exams;
    return exams.filter(exam => exam.subject === subject);
}

/**
 * Carga y muestra los exámenes disponibles
 */
async function displayExams() {
    const examsContainer = document.getElementById('exams-container');
    examsContainer.innerHTML = '<div class="loading">Cargando exámenes disponibles...</div>';
    
    try {
        const exams = await loadAvailableExams();
        
        if (exams.length === 0) {
            examsContainer.innerHTML = '<div class="no-exams">No hay exámenes disponibles en este momento.</div>';
            return;
        }
        
        // Limpiar el contenedor
        examsContainer.innerHTML = '';
        
        // Agregar filtro por asignatura
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        filterContainer.innerHTML = `
            <label>
                Filtrar por asignatura:
                <select id="subject-filter">
                    <option value="all">Todas</option>
                    <option value="physics">Física</option>
                    <option value="math">Matemáticas</option>
                </select>
            </label>
        `;
        examsContainer.parentNode.insertBefore(filterContainer, examsContainer);
        
        // Función para mostrar exámenes filtrados
        const showFilteredExams = (subject) => {
            const filteredExams = filterExamsBySubject(exams, subject);
            examsContainer.innerHTML = '';
            
            if (filteredExams.length === 0) {
                examsContainer.innerHTML = '<div class="no-exams">No hay exámenes disponibles para esta asignatura.</div>';
                return;
            }
            
            filteredExams.forEach(exam => {
                const card = createExamCard(exam);
                examsContainer.appendChild(card);
            });
        };
        
        // Mostrar todos los exámenes inicialmente
        showFilteredExams('all');
        
        // Agregar evento al filtro
        document.getElementById('subject-filter').addEventListener('change', (e) => {
            showFilteredExams(e.target.value);
        });
        
    } catch (error) {
        console.error('Error mostrando los exámenes:', error);
        examsContainer.innerHTML = '<div class="error">Error al cargar los exámenes. Por favor, intenta nuevamente más tarde.</div>';
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    displayExams();
});