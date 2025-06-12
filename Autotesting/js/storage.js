/**
 * Módulo de gestión de almacenamiento local
 */

const Storage = {
    /**
     * Prefijo para todas las claves del simulador
     */
    prefix: '',
    
    /**
     * Obtiene un valor del localStorage
     * @param {string} key - Clave a buscar
     * @param {*} defaultValue - Valor por defecto si no existe
     * @returns {*} Valor almacenado o valor por defecto
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error al obtener datos del localStorage:', error);
            return defaultValue;
        }
    },
    
    /**
     * Guarda un valor en localStorage
     * @param {string} key - Clave donde guardar
     * @param {*} value - Valor a guardar
     * @returns {boolean} True si se guardó correctamente
     */
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
            return false;
        }
    },
    
    /**
     * Elimina un valor del localStorage
     * @param {string} key - Clave a eliminar
     */
    remove(key) {
        localStorage.removeItem(this.prefix + key);
    },
    
    /**
     * Obtiene el historial de exámenes
     * @returns {Array} Array de exámenes realizados
     */
    getExamHistory() {
        return this.get('examHistory', []);
    },
    
    /**
     * Guarda un nuevo resultado de examen
     * @param {Object} examResult - Resultado del examen
     */
    saveExamResult(examResult) {
        const history = this.getExamHistory();
        history.push({
            ...examResult,
            id: generateId(),
            timestamp: new Date().toISOString()
        });
        this.set('examHistory', history);
    },
    
    /**
     * Obtiene las estadísticas globales
     * @returns {Object} Estadísticas globales
     */
    getGlobalStats() {
        return this.get('globalStats', {
            totalExams: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            totalTime: 0,
            bySubject: {},
            byTopic: {},
            streak: { current: 0, best: 0, lastDate: null }
        });
    },
    
    /**
     * Actualiza las estadísticas globales
     * @param {Object} stats - Nuevas estadísticas
     */
    updateGlobalStats(stats) {
        this.set('globalStats', stats);
    },
    
    /**
     * Obtiene el perfil del usuario actual
     * @returns {Object} Perfil del usuario
     */
    getUserProfile() {
        return this.get('userProfile', {
            name: 'Usuario',
            created: new Date().toISOString(),
            preferences: {
                theme: 'light',
                notifications: true,
                defaultTimeLimit: 600
            }
        });
    },
    
    /**
     * Actualiza el perfil del usuario
     * @param {Object} profile - Datos del perfil
     */
    updateUserProfile(profile) {
        const current = this.getUserProfile();
        this.set('userProfile', { ...current, ...profile });
    },
    
    /**
     * Obtiene las preguntas programadas para repaso
     * @returns {Array} Array de preguntas para repasar
     */
    getScheduledReviews() {
        return this.get('scheduledReviews', []);
    },
    
    /**
     * Programa una pregunta para repaso futuro
     * @param {Object} question - Pregunta a programar
     * @param {Date} reviewDate - Fecha de repaso
     */
    scheduleReview(question, reviewDate) {
        const reviews = this.getScheduledReviews();
        reviews.push({
            ...question,
            scheduledFor: reviewDate.toISOString(),
            id: generateId()
        });
        this.set('scheduledReviews', reviews);
    },
    
    /**
     * Obtiene las preguntas marcadas como favoritas
     * @returns {Array} Array de preguntas favoritas
     */
    getFavoriteQuestions() {
        return this.get('favoriteQuestions', []);
    },
    
    /**
     * Marca/desmarca una pregunta como favorita
     * @param {Object} question - Pregunta a marcar
     */
    toggleFavorite(question) {
        const favorites = this.getFavoriteQuestions();
        const index = favorites.findIndex(q => q.id === question.id);
        
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(question);
        }
        
        this.set('favoriteQuestions', favorites);
    },
    
    /**
     * Obtiene las notas del usuario
     * @returns {Object} Objeto con notas por pregunta
     */
    getUserNotes() {
        return this.get('userNotes', {});
    },
    
    /**
     * Guarda una nota para una pregunta
     * @param {string} questionId - ID de la pregunta
     * @param {string} note - Nota a guardar
     */
    saveNote(questionId, note) {
        const notes = this.getUserNotes();
        if (note.trim()) {
            notes[questionId] = note;
        } else {
            delete notes[questionId];
        }
        this.set('userNotes', notes);
    },
    
    /**
     * Calcula y devuelve estadísticas rápidas
     * @returns {Object} Estadísticas rápidas
     */
    getQuickStats() {
        const history = this.getExamHistory();
        const globalStats = this.getGlobalStats();
        
        // Últimos 7 días
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const recentExams = history.filter(exam => 
            new Date(exam.date || exam.timestamp) > lastWeek
        );
        
        return {
            totalExams: history.length,
            recentExams: recentExams.length,
            averageScore: globalStats.totalQuestions > 0 
                ? (globalStats.totalCorrect / globalStats.totalQuestions * 100).toFixed(1)
                : 0,
            currentStreak: globalStats.streak.current,
            totalTime: formatTime(globalStats.totalTime || 0)
        };
    },
    
    /**
     * Exporta todos los datos del usuario
     * @returns {Object} Todos los datos almacenados
     */
    exportData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const cleanKey = key.replace(this.prefix, '');
                data[cleanKey] = this.get(cleanKey);
            }
        }
        return data;
    },
    
    /**
     * Importa datos desde un objeto
     * @param {Object} data - Datos a importar
     * @returns {boolean} True si se importó correctamente
     */
    importData(data) {
        try {
            Object.entries(data).forEach(([key, value]) => {
                this.set(key, value);
            });
            return true;
        } catch (error) {
            console.error('Error al importar datos:', error);
            return false;
        }
    },
    
    /**
     * Limpia todos los datos del simulador
     * @param {boolean} confirm - Confirmación de seguridad
     */
    clearAllData(confirm = false) {
        if (!confirm) {
            console.warn('Debes confirmar para borrar todos los datos');
            return;
        }
        
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                keys.push(key);
            }
        }
        
        keys.forEach(key => localStorage.removeItem(key));
    }
};