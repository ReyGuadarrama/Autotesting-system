/**
 * Utilidades generales para el simulador de exámenes
 */

/**
 * Formatea una fecha a formato legible
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(date) {
    const d = new Date(date);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return d.toLocaleDateString('es-ES', options);
}

/**
 * Formatea una fecha a formato corto
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatShortDate(date) {
    const d = new Date(date);
    const options = { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return d.toLocaleDateString('es-ES', options);
}

/**
 * Convierte segundos a formato de tiempo legible
 * @param {number} seconds - Segundos a convertir
 * @returns {string} Tiempo formateado
 */
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

/**
 * Calcula el porcentaje
 * @param {number} value - Valor actual
 * @param {number} total - Valor total
 * @returns {number} Porcentaje
 */
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return (value / total) * 100;
}

/**
 * Obtiene el color según el porcentaje de acierto
 * @param {number} percentage - Porcentaje
 * @returns {string} Clase CSS de color
 */
function getScoreColor(percentage) {
    if (percentage >= 80) return 'score-excellent';
    if (percentage >= 60) return 'score-good';
    if (percentage >= 40) return 'score-regular';
    return 'score-poor';
}

/**
 * Agrupa elementos de un array por una propiedad
 * @param {Array} array - Array a agrupar
 * @param {string} key - Propiedad por la cual agrupar
 * @returns {Object} Objeto con los grupos
 */
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key] || 'other';
        if (!result[group]) result[group] = [];
        result[group].push(item);
        return result;
    }, {});
}

/**
 * Obtiene el nombre en español de una asignatura
 * @param {string} subject - Código de la asignatura
 * @returns {string} Nombre en español
 */
function getSubjectName(subject) {
    const subjects = {
        'math': 'Matemáticas',
        'physics': 'Física',
        'chemistry': 'Química',
        'biology': 'Biología',
        'general': 'General'
    };
    return subjects[subject] || subject;
}

/**
 * Obtiene el nombre en español de un tema
 * @param {string} topic - Código del tema
 * @returns {string} Nombre en español
 */
function getTopicName(topic) {
    const topics = {
        // Matemáticas
        'algebra': 'Álgebra',
        'calculus': 'Cálculo',
        'geometry': 'Geometría',
        'trigonometry': 'Trigonometría',
        'statistics': 'Estadística',
        
        // Física
        'mechanics': 'Mecánica',
        'thermodynamics': 'Termodinámica',
        'electromagnetism': 'Electromagnetismo',
        'optics': 'Óptica',
        'waves': 'Ondas',
        'quantum': 'Física Cuántica',
        
        // General
        'general': 'General',
        'reading': 'Comprensión Lectora'
    };
    return topics[topic] || topic;
}

/**
 * Calcula la racha de días consecutivos
 * @param {Array} dates - Array de fechas ISO
 * @returns {number} Días consecutivos
 */
function calculateStreak(dates) {
    if (!dates || dates.length === 0) return 0;
    
    // Ordenar fechas de más reciente a más antigua
    const sortedDates = dates
        .map(d => new Date(d).toDateString())
        .sort((a, b) => new Date(b) - new Date(a));
    
    // Eliminar duplicados
    const uniqueDates = [...new Set(sortedDates)];
    
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    // Verificar si hay actividad hoy o ayer
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0; // Racha rota
    }
    
    // Contar días consecutivos
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i + 1]);
        const dayDiff = (current - next) / 86400000;
        
        if (dayDiff === 1) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak + 1; // +1 por el día inicial
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce para optimizar funciones que se llaman frecuentemente
 * @param {Function} func - Función a optimizar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función optimizada
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Verifica si el navegador soporta las características necesarias
 * @returns {boolean} True si soporta todo
 */
function checkBrowserSupport() {
    return (
        'localStorage' in window &&
        'JSON' in window &&
        'querySelector' in document
    );
}

/**
 * Muestra un mensaje temporal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (success, error, info)
 * @param {number} duration - Duración en ms
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}