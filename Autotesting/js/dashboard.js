/**
 * Script principal para el Dashboard
 */

// Cargar estadísticas al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    loadRecentActivity();
    loadPendingReviews();
});

/**
 * Carga los datos principales del dashboard
 */
function loadDashboardData() {
    const stats = Storage.getQuickStats();
    const globalStats = Storage.getGlobalStats();
    
    // Actualizar los números en las tarjetas
    document.getElementById('total-exams').textContent = stats.totalExams;
    document.getElementById('average-score').textContent = stats.averageScore + '%';
    document.getElementById('current-streak').textContent = stats.currentStreak + ' días';
    document.getElementById('total-time').textContent = stats.totalTime;
    
    // Añadir clases de color según el promedio
    const averageElement = document.getElementById('average-score');
    averageElement.className = 'stat-number ' + getScoreColor(parseFloat(stats.averageScore));
}

/**
 * Carga la actividad reciente
 */
function loadRecentActivity() {
    const history = Storage.getExamHistory();
    const recentExams = history
        .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp))
        .slice(0, 5); // Últimos 5 exámenes
    
    const container = document.getElementById('recent-exams');
    
    if (recentExams.length === 0) {
        container.innerHTML = '<p class="no-data">No hay exámenes recientes</p>';
        return;
    }
    
    container.innerHTML = recentExams.map(exam => {
        const percentage = exam.percentage || ((exam.score / exam.totalQuestions) * 100);
        const scoreClass = getScoreColor(percentage);
        
        return `
            <div class="exam-history-item">
                <div class="exam-info">
                    <h4>${exam.examTitle || 'Examen'}</h4>
                    <span class="exam-date">${formatShortDate(exam.date || exam.timestamp)}</span>
                    <span class="subject ${exam.subject || 'general'}">${getSubjectName(exam.subject || 'general')}</span>
                </div>
                <div class="exam-score ${scoreClass}">
                    ${percentage.toFixed(0)}%
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Carga las revisiones pendientes
 */
function loadPendingReviews() {
    const reviews = Storage.getScheduledReviews();
    const now = new Date();
    
    // Filtrar y ordenar revisiones pendientes
    const pendingReviews = reviews
        .filter(review => new Date(review.scheduledFor) <= now)
        .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
        .slice(0, 5); // Máximo 5 revisiones
    
    const container = document.getElementById('pending-reviews');
    
    if (pendingReviews.length === 0) {
        container.innerHTML = '<p class="no-data">No hay revisiones programadas</p>';
        return;
    }
    
    container.innerHTML = pendingReviews.map(review => {
        const overdue = new Date(review.scheduledFor) < new Date(now.getTime() - 86400000); // Más de 1 día
        
        return `
            <div class="review-card ${overdue ? 'overdue' : ''}">
                <div class="review-info">
                    <h4>${review.question || 'Pregunta para revisar'}</h4>
                    <span class="review-date">Programada para: ${formatShortDate(review.scheduledFor)}</span>
                </div>
                <div class="review-actions">
                    <button class="review-btn" onclick="startReview('${review.id}')">
                        Revisar ahora
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Inicia una revisión
 * @param {string} reviewId - ID de la revisión
 */
function startReview(reviewId) {
    // Por ahora, mostrar un mensaje
    // En el futuro, esto llevará a un modo de revisión específico
    showToast('Función de revisión en desarrollo', 'info');
}

/**
 * Actualiza el dashboard cada 30 segundos
 */
setInterval(() => {
    loadDashboardData();
    loadRecentActivity();
    loadPendingReviews();
}, 30000);