let examData = null;
let currentQuestion = 0;
let score = 0;
let timeLeft = 30;
let userAnswers = [];
let timerInterval;
let reviewMode = false;
let startTime = null;
let questionStartTime = null;
let questionTimes = [];

async function loadExamData() {
    try {
        // Obtener el ID del examen de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const examId = urlParams.get('id') || 'default';
        
        // Determinar la ruta del archivo basándose en el ID
        let examPath = '';
        if (examId.includes('physics')) {
            examPath = `./data/exams/physics/${examId}.json`;
        } else if (examId.includes('math')) {
            examPath = `./data/exams/math/${examId}.json`;
        } else {
            // Ruta por defecto para exámenes antiguos
            examPath = `./data/exams/${examId}.json`;
        }
        
        const response = await fetch(examPath);
        
        if (!response.ok) {
            throw new Error('Examen no encontrado');
        }
        
        examData = await response.json();
        timeLeft = examData.timeLimit;
        startTime = Date.now();
        questionStartTime = startTime;
        initializeExam();
    } catch (error) {
        console.error('Error cargando los datos del examen:', error);
        document.querySelector('.container').innerHTML = `
            <div class="error">
                <h2>Error al cargar el examen</h2>
                <p>No se pudo cargar el examen seleccionado. <a href="index.html">Volver al menú principal</a>.</p>
            </div>
        `;
    }
}

function initializeExam() {
    // Crear y agregar el navegador de preguntas
    const navigator = createQuestionNavigator();
    const container = document.querySelector('.container');
    container.insertBefore(navigator, document.getElementById('quiz'));
    
    showQuestion();
    timerInterval = setInterval(updateTimer, 1000);
}

function showQuestion() {
    const quizContainer = document.getElementById('quiz');
    
    // Si estamos en modo de revisión final
    if (reviewMode) {
        let content = `
            <div class="final-message">
                <h3>¡Has completado todas las preguntas!</h3>
                <p>Ahora puedes:</p>
                <ul>
                    <li>Revisar tus respuestas haciendo clic en los números de pregunta en la parte superior.</li>
                    <li>O finalizar el examen y ver tus resultados haciendo clic en el botón "Ver Resultados".</li>
                </ul>
                <p class="questions-stats">Has respondido ${userAnswers.filter(answer => answer !== undefined).length} de ${examData.questions.length} preguntas.</p>
            </div>
        `;
        
        quizContainer.innerHTML = content;
        document.getElementById('nextBtn').textContent = 'Ver Resultados';
        document.getElementById('progress').textContent = 'Revisión Final';
        return;
    }
    
    // Registrar el tiempo de inicio de la nueva pregunta
    questionStartTime = Date.now();
    
    // Si no estamos en modo de revisión, mostrar pregunta normal
    const question = examData.questions[currentQuestion];
    let content = '';
    
    // Verificar si es una pregunta de tipo reading
    if (question.type === "reading" && examData.readingSection) {
        content += `
            <div class="reading-question-layout">
                <div class="reading-section" id="readingSection">
                    <h3 class="section-title">${examData.readingSection.title}</h3>
                    <div class="content">
                        <p>${examData.readingSection.content}</p>
                    </div>
                </div>
                
                <div class="question-section">
                    <div class="question">
                        <h3>${question.question}</h3>
                        <div class="options">
                            ${question.options.map((option, index) => {
                                const isAnswered = userAnswers[currentQuestion] !== undefined;
                                const isSelected = isAnswered && userAnswers[currentQuestion] === index;
                                return `
                                    <label>
                                        <input type="radio" name="question" value="${index}" ${isSelected ? 'checked' : ''}>
                                        ${option}
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Layout estándar para preguntas normales
        const processedQuestion = question.question;
        let optionsHTML = '';
        
        question.options.forEach((option, index) => {
            const isAnswered = userAnswers[currentQuestion] !== undefined;
            const isSelected = isAnswered && userAnswers[currentQuestion] === index;
            optionsHTML += `
                <label>
                    <input type="radio" name="question" value="${index}" ${isSelected ? 'checked' : ''}>
                    ${option}
                </label>
            `;
        });

        content += `
            <div class="question">
                <h3>${processedQuestion}</h3>
                <div class="options">
                    ${optionsHTML}
                </div>
            </div>
        `;
    }

    quizContainer.innerHTML = content;
    
    // Actualizar el progreso
    document.getElementById('progress').textContent = 
        `Pregunta ${currentQuestion + 1} de ${examData.questions.length}`;
    
    // Cambiar el texto del botón dependiendo de si es la última pregunta
    document.getElementById('nextBtn').textContent = 
        currentQuestion === examData.questions.length - 1 ? 'Terminar' : 'Siguiente';
        
    // Actualizar el navegador de preguntas
    updateQuestionNavigator();
    
    // Renderizar las expresiones matemáticas después de actualizar el contenido
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

function createQuestionNavigator() {
    const container = document.createElement('div');
    container.className = 'question-navigator';
    
    examData.questions.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = 'question-indicator';
        indicator.setAttribute('data-question', index);
        
        // Agregar número de pregunta
        indicator.textContent = index + 1;
        
        // Actualizar estado inicial
        if (userAnswers[index] !== undefined) {
            indicator.classList.add('answered');
        }
        
        // Marcar la pregunta actual
        if (index === currentQuestion) {
            indicator.classList.add('current');
        }
        
        // Agregar evento de click
        indicator.addEventListener('click', () => navigateToQuestion(index));
        
        container.appendChild(indicator);
    });
    
    return container;
}

function navigateToQuestion(questionIndex) {
    // Si estamos en modo de revisión, salimos de él
    if (reviewMode) {
        reviewMode = false;
    }
    
    if (questionIndex === currentQuestion && !reviewMode) return;
    
    // Guardar la respuesta actual antes de navegar
    saveAnswer();
    
    // Guardar el tiempo de la pregunta actual
    if (questionStartTime) {
        questionTimes[currentQuestion] = (questionTimes[currentQuestion] || 0) + 
            (Date.now() - questionStartTime);
    }
    
    // Actualizar la pregunta actual
    currentQuestion = questionIndex;
    showQuestion();
    updateQuestionNavigator();
}

function updateQuestionNavigator() {
    const indicators = document.querySelectorAll('.question-indicator');
    
    indicators.forEach((indicator, index) => {
        // Actualizar estado de respondida
        indicator.classList.toggle('answered', userAnswers[index] !== undefined);
        // Actualizar pregunta actual
        indicator.classList.toggle('current', index === currentQuestion && !reviewMode);
    });
    
    // Si estamos en modo revisión, ninguna pregunta está "activa"
    if (reviewMode) {
        indicators.forEach(indicator => {
            indicator.classList.remove('current');
        });
    }
}

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timerElement = document.getElementById('timer');
    timerElement.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 5) {
        timerElement.classList.add('warning');
    }
    
    if (timeLeft === 0) {
        finishExam();
    } else {
        timeLeft--;
    }
}

function saveAnswer() {
    const selectedOption = document.querySelector('input[name="question"]:checked');
    if (selectedOption) {
        const selectedValue = parseInt(selectedOption.value);
        userAnswers[currentQuestion] = selectedValue;
        
        // Actualizar el navegador después de guardar la respuesta
        updateQuestionNavigator();
    }
}

function calculateScore() {
    let correctCount = 0;
    examData.questions.forEach((question, index) => {
        if (userAnswers[index] === question.correct) {
            correctCount++;
        }
    });
    return correctCount;
}

function showFeedback() {
    const detailedFeedback = document.getElementById('detailed-feedback');
    let feedbackHTML = '';
    
    examData.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct;
        const userAnswerText = userAnswer !== undefined ? question.options[userAnswer] : "Sin responder";
        
        feedbackHTML += `
            <div class="feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>Pregunta ${index + 1}:</strong> ${question.question}<br>
                Tu respuesta: ${userAnswerText}<br>
                Respuesta correcta: ${question.options[question.correct]}<br>
                ${question.feedback}
            </div>
        `;
    });
    
    detailedFeedback.innerHTML = feedbackHTML;
    
    // Renderizar las expresiones matemáticas en la retroalimentación
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

function calculateStatistics() {
    const totalQuestions = examData.questions.length;
    const answeredQuestions = userAnswers.filter(answer => answer !== undefined).length;
    const unansweredQuestions = totalQuestions - answeredQuestions;
    
    // Calcular respuestas correctas
    const correctAnswers = calculateScore();
    const incorrectAnswers = answeredQuestions - correctAnswers;
    const percentage = (correctAnswers / totalQuestions) * 100;
    
    // Calcular tiempo promedio por pregunta
    const totalTimeUsed = examData.timeLimit - timeLeft;
    const averageTimePerQuestion = answeredQuestions > 0 ? 
        (totalTimeUsed / answeredQuestions).toFixed(1) : 0;
    
    // Calcular tasa de aciertos por tipo de pregunta
    const questionTypes = {};
    examData.questions.forEach((question, index) => {
        const type = question.type || 'general';
        if (!questionTypes[type]) {
            questionTypes[type] = { total: 0, correct: 0 };
        }
        questionTypes[type].total++;
        if (userAnswers[index] === question.correct) {
            questionTypes[type].correct++;
        }
    });

    return {
        totalQuestions,
        answeredQuestions,
        unansweredQuestions,
        correctAnswers,
        incorrectAnswers,
        percentage,
        averageTimePerQuestion,
        questionTypes,
        totalTimeUsed
    };
}

function saveExamResults(stats) {
    // Guardar el tiempo de la última pregunta
    if (questionStartTime) {
        questionTimes[currentQuestion] = (questionTimes[currentQuestion] || 0) + 
            (Date.now() - questionStartTime);
    }
    
    const examResult = {
        examId: new URLSearchParams(window.location.search).get('id'),
        examTitle: examData.examTitle,
        subject: examData.subject || 'general',
        topic: examData.topic || 'general',
        date: new Date().toISOString(),
        score: stats.correctAnswers,
        totalQuestions: stats.totalQuestions,
        percentage: stats.percentage,
        timeUsed: stats.totalTimeUsed,
        answeredQuestions: stats.answeredQuestions,
        questionDetails: examData.questions.map((question, index) => ({
            questionId: index,
            topic: question.topic || examData.topic || 'general',
            subtopic: question.subtopic || '',
            type: question.type || 'general',
            difficulty: question.difficulty || examData.difficulty || 'medium',
            correct: userAnswers[index] === question.correct,
            answered: userAnswers[index] !== undefined,
            timeSpent: questionTimes[index] || 0,
            tags: question.tags || []
        }))
    };
    
    // Guardar en localStorage
    const examHistory = JSON.parse(localStorage.getItem('examHistory') || '[]');
    examHistory.push(examResult);
    localStorage.setItem('examHistory', JSON.stringify(examHistory));
    
    // Actualizar estadísticas globales
    updateGlobalStats(examResult);
}

function updateGlobalStats(examResult) {
    const globalStats = JSON.parse(localStorage.getItem('globalStats') || '{}');
    
    // Inicializar estructura si no existe
    if (!globalStats.totalExams) {
        globalStats.totalExams = 0;
        globalStats.totalQuestions = 0;
        globalStats.totalCorrect = 0;
        globalStats.totalTime = 0;
        globalStats.bySubject = {};
        globalStats.byTopic = {};
        globalStats.streak = { current: 0, best: 0, lastDate: null };
    }
    
    // Actualizar estadísticas generales
    globalStats.totalExams++;
    globalStats.totalQuestions += examResult.totalQuestions;
    globalStats.totalCorrect += examResult.score;
    globalStats.totalTime += examResult.timeUsed;
    
    // Actualizar racha
    const today = new Date().toDateString();
    const lastDate = globalStats.streak.lastDate ? new Date(globalStats.streak.lastDate).toDateString() : null;
    
    if (lastDate === today) {
        // Ya hizo un examen hoy, no cambiar la racha
    } else if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
        // Examen ayer, continuar racha
        globalStats.streak.current++;
    } else {
        // Racha rota, empezar nueva
        globalStats.streak.current = 1;
    }
    
    globalStats.streak.lastDate = new Date().toISOString();
    globalStats.streak.best = Math.max(globalStats.streak.best, globalStats.streak.current);
    
    // Actualizar por asignatura
    const subject = examResult.subject;
    if (!globalStats.bySubject[subject]) {
        globalStats.bySubject[subject] = {
            totalExams: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            totalTime: 0
        };
    }
    
    globalStats.bySubject[subject].totalExams++;
    globalStats.bySubject[subject].totalQuestions += examResult.totalQuestions;
    globalStats.bySubject[subject].totalCorrect += examResult.score;
    globalStats.bySubject[subject].totalTime += examResult.timeUsed;
    
    // Actualizar por tema
    examResult.questionDetails.forEach(question => {
        const topic = question.topic;
        if (!globalStats.byTopic[topic]) {
            globalStats.byTopic[topic] = {
                totalQuestions: 0,
                totalCorrect: 0,
                totalTime: 0,
                byDifficulty: {}
            };
        }
        
        globalStats.byTopic[topic].totalQuestions++;
        if (question.correct) {
            globalStats.byTopic[topic].totalCorrect++;
        }
        globalStats.byTopic[topic].totalTime += question.timeSpent;
        
        // Por dificultad
        const difficulty = question.difficulty;
        if (!globalStats.byTopic[topic].byDifficulty[difficulty]) {
            globalStats.byTopic[topic].byDifficulty[difficulty] = {
                total: 0,
                correct: 0
            };
        }
        
        globalStats.byTopic[topic].byDifficulty[difficulty].total++;
        if (question.correct) {
            globalStats.byTopic[topic].byDifficulty[difficulty].correct++;
        }
    });
    
    localStorage.setItem('globalStats', JSON.stringify(globalStats));
}

function finishExam() {
    clearInterval(timerInterval);
    
    const stats = calculateStatistics();
    
    // Guardar resultados antes de mostrar
    saveExamResults(stats);
    
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    // Actualizar la puntuación
    document.getElementById('score').textContent = stats.correctAnswers;
    document.getElementById('percentage').textContent = stats.percentage.toFixed(1);
    
    // Mostrar resultados detallados
    const statsHTML = `
        <div class="statistics-container">
            <h3>Estadísticas Generales</h3>
            <p>Puntuación final: ${stats.correctAnswers} de ${stats.totalQuestions}</p>
            <p>Porcentaje de aciertos: ${stats.percentage.toFixed(1)}%</p>
            <p>Preguntas respondidas: ${stats.answeredQuestions} de ${stats.totalQuestions}</p>
            <p>Preguntas sin responder: ${stats.unansweredQuestions}</p>
            <p>Respuestas correctas: ${stats.correctAnswers}</p>
            <p>Respuestas incorrectas: ${stats.incorrectAnswers}</p>
            <p>Tiempo promedio por pregunta: ${stats.averageTimePerQuestion} segundos</p>
            
            <h3>Rendimiento por Tipo de Pregunta</h3>
            ${Object.entries(stats.questionTypes).map(([type, data]) => `
                <div class="question-type-stat">
                    <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                    <p>Aciertos: ${data.correct} de ${data.total}</p>
                    <p>Porcentaje: ${((data.correct / data.total) * 100).toFixed(1)}%</p>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('results').innerHTML = `
        <h2>Resultados del examen</h2>
        ${statsHTML}
        <h3>Retroalimentación detallada:</h3>
        <div id="detailed-feedback"></div>
    `;
    
    showFeedback();

    // Agregar botones de navegación
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.innerHTML = `
        <button class="btn return-btn" onclick="window.location.href='index.html'">
            Volver al Menú Principal
        </button>
        <button class="btn dashboard-btn" onclick="window.location.href='dashboard.html'">
            Ver Dashboard
        </button>
    `;
    document.getElementById('results').appendChild(buttonContainer);
}

document.getElementById('nextBtn').addEventListener('click', () => {
    saveAnswer(); // Guarda la respuesta actual si existe
    
    // Si estamos en modo de revisión y hacemos clic en "Ver Resultados"
    if (reviewMode) {
        finishExam();
        return;
    }
    
    // Guardar el tiempo de la pregunta actual
    if (questionStartTime) {
        questionTimes[currentQuestion] = (questionTimes[currentQuestion] || 0) + 
            (Date.now() - questionStartTime);
    }
    
    // Si es la última pregunta, activar modo de revisión
    if (currentQuestion === examData.questions.length - 1) {
        reviewMode = true;
        showQuestion(); // Mostrar pantalla de revisión
    } else {
        // Avanzar a la siguiente pregunta
        currentQuestion++;
        showQuestion();
    }
});

// Cargar el examen cuando se carga la página
document.addEventListener('DOMContentLoaded', loadExamData);