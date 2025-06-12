/**
 * Script principal para las Estadísticas
 */

let currentPeriod = 'month';
let currentSubject = 'all';

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    loadStatistics();
});

/**
 * Inicializa los filtros
 */
function initializeFilters() {
    const periodFilter = document.getElementById('period-filter');
    const subjectFilter = document.getElementById('subject-filter');
    
    periodFilter.addEventListener('change', (e) => {
        currentPeriod = e.target.value;
        loadStatistics();
    });
    
    subjectFilter.addEventListener('change', (e) => {
        currentSubject = e.target.value;
        loadStatistics();
    });
}

/**
 * Carga todas las estadísticas
 */
function loadStatistics() {
    const history = Storage.getExamHistory();
    const filteredData = filterData(history);
    
    if (filteredData.length === 0) {
        showNoDataMessage();
        return;
    }
    
    drawProgressChart(filteredData);
    drawTopicsChart(filteredData);
    drawDifficultyChart(filteredData);
    drawTimeChart(filteredData);
    showTopicBreakdown(filteredData);
}

/**
 * Filtra los datos según el período y asignatura seleccionados
 */
function filterData(history) {
    let filtered = [...history];
    
    // Filtrar por período
    const now = new Date();
    let startDate = new Date();
    
    switch (currentPeriod) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'all':
            startDate = new Date(0); // Desde el principio
            break;
    }
    
    filtered = filtered.filter(exam => 
        new Date(exam.date || exam.timestamp) >= startDate
    );
    
    // Filtrar por asignatura
    if (currentSubject !== 'all') {
        filtered = filtered.filter(exam => exam.subject === currentSubject);
    }
    
    return filtered;
}

/**
 * Muestra mensaje cuando no hay datos
 */
function showNoDataMessage() {
    const charts = ['progress-chart', 'topics-chart', 'difficulty-chart', 'time-chart'];
    charts.forEach(chartId => {
        const canvas = document.getElementById(chartId);
        const container = canvas.parentElement;
        container.innerHTML = `
            <h3>${container.querySelector('h3').textContent}</h3>
            <div class="chart-placeholder">
                <p>No hay datos para el período seleccionado</p>
            </div>
        `;
    });
    
    document.getElementById('topic-breakdown').innerHTML = 
        '<p class="no-data">No hay datos suficientes para mostrar</p>';
}

/**
 * Dibuja el gráfico de progreso temporal
 */
function drawProgressChart(data) {
    const canvas = document.getElementById('progress-chart');
    const ctx = canvas.getContext('2d');
    
    // Agrupar por fecha
    const groupedByDate = {};
    data.forEach(exam => {
        const date = new Date(exam.date || exam.timestamp).toLocaleDateString();
        if (!groupedByDate[date]) {
            groupedByDate[date] = { total: 0, correct: 0 };
        }
        groupedByDate[date].total += exam.totalQuestions;
        groupedByDate[date].correct += exam.score;
    });
    
    // Preparar datos para el gráfico
    const dates = Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b));
    const percentages = dates.map(date => 
        (groupedByDate[date].correct / groupedByDate[date].total * 100).toFixed(1)
    );
    
    // Dibujar gráfico simple (sin librería)
    drawLineChart(ctx, dates, percentages, 'Porcentaje de aciertos');
}

/**
 * Dibuja el gráfico de rendimiento por tema
 */
function drawTopicsChart(data) {
    const canvas = document.getElementById('topics-chart');
    const ctx = canvas.getContext('2d');
    
    // Agrupar por tema
    const topicStats = {};
    data.forEach(exam => {
        if (exam.questionDetails) {
            exam.questionDetails.forEach(question => {
                const topic = question.topic || 'general';
                if (!topicStats[topic]) {
                    topicStats[topic] = { total: 0, correct: 0 };
                }
                topicStats[topic].total++;
                if (question.correct) {
                    topicStats[topic].correct++;
                }
            });
        }
    });
    
    // Preparar datos para el gráfico
    const topics = Object.keys(topicStats);
    const percentages = topics.map(topic => 
        (topicStats[topic].correct / topicStats[topic].total * 100).toFixed(1)
    );
    
    // Dibujar gráfico de barras
    drawBarChart(ctx, topics.map(getTopicName), percentages, 'Porcentaje de aciertos');
}

/**
 * Dibuja el gráfico de distribución de dificultad
 */
function drawDifficultyChart(data) {
    const canvas = document.getElementById('difficulty-chart');
    const ctx = canvas.getContext('2d');
    
    // Contar preguntas por dificultad
    const difficultyCount = { easy: 0, medium: 0, hard: 0 };
    data.forEach(exam => {
        if (exam.questionDetails) {
            exam.questionDetails.forEach(question => {
                const difficulty = question.difficulty || 'medium';
                difficultyCount[difficulty] = (difficultyCount[difficulty] || 0) + 1;
            });
        }
    });
    
    // Dibujar gráfico circular simple
    const total = Object.values(difficultyCount).reduce((a, b) => a + b, 0);
    const labels = ['Fácil', 'Intermedio', 'Avanzado'];
    const values = [difficultyCount.easy, difficultyCount.medium, difficultyCount.hard];
    const colors = ['#27ae60', '#f39c12', '#e74c3c'];
    
    drawPieChart(ctx, labels, values, colors);
}

/**
 * Dibuja el gráfico de tiempo de respuesta
 */
function drawTimeChart(data) {
    const canvas = document.getElementById('time-chart');
    const ctx = canvas.getContext('2d');
    
    // Recopilar tiempos de respuesta
    const times = [];
    data.forEach(exam => {
        if (exam.questionDetails) {
            exam.questionDetails.forEach(question => {
                if (question.timeSpent && question.timeSpent > 0) {
                    times.push(question.timeSpent / 1000); // Convertir a segundos
                }
            });
        }
    });
    
    if (times.length === 0) {
        ctx.fillText('No hay datos de tiempo disponibles', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Crear histograma
    const bins = createHistogramBins(times, 10);
    drawHistogram(ctx, bins, 'Tiempo (segundos)', 'Frecuencia');
}

/**
 * Muestra el desglose por tema
 */
function showTopicBreakdown(data) {
    const container = document.getElementById('topic-breakdown');
    
    // Agrupar estadísticas por tema
    const topicStats = {};
    data.forEach(exam => {
        if (exam.questionDetails) {
            exam.questionDetails.forEach(question => {
                const topic = question.topic || 'general';
                if (!topicStats[topic]) {
                    topicStats[topic] = {
                        total: 0,
                        correct: 0,
                        totalTime: 0,
                        byDifficulty: { easy: 0, medium: 0, hard: 0 }
                    };
                }
                
                topicStats[topic].total++;
                if (question.correct) {
                    topicStats[topic].correct++;
                }
                if (question.timeSpent) {
                    topicStats[topic].totalTime += question.timeSpent;
                }
                
                const difficulty = question.difficulty || 'medium';
                topicStats[topic].byDifficulty[difficulty]++;
            });
        }
    });
    
    // Generar HTML
    const topicsHtml = Object.entries(topicStats).map(([topic, stats]) => {
        const percentage = (stats.correct / stats.total * 100).toFixed(1);
        const avgTime = (stats.totalTime / stats.total / 1000).toFixed(1);
        
        return `
            <div class="topic-stat">
                <div class="topic-name">${getTopicName(topic)}</div>
                <div class="topic-details">
                    <div class="topic-metric">
                        <span class="value">${percentage}%</span>
                        <span class="label">Aciertos</span>
                    </div>
                    <div class="topic-metric">
                        <span class="value">${stats.total}</span>
                        <span class="label">Preguntas</span>
                    </div>
                    <div class="topic-metric">
                        <span class="value">${avgTime}s</span>
                        <span class="label">Tiempo promedio</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = topicsHtml || '<p class="no-data">No hay datos por tema disponibles</p>';
}

/**
 * Funciones auxiliares para dibujar gráficos sin librerías
 */

function drawLineChart(ctx, labels, values, dataLabel) {
    const canvas = ctx.canvas;
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Encontrar valores máximos y mínimos
    const maxValue = Math.max(...values.map(v => parseFloat(v)));
    const minValue = 0;
    
    // Dibujar ejes
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Dibujar línea
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    labels.forEach((label, index) => {
        const x = padding + (chartWidth / (labels.length - 1)) * index;
        const y = canvas.height - padding - ((values[index] - minValue) / (maxValue - minValue)) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Dibujar punto
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    ctx.stroke();
}

function drawBarChart(ctx, labels, values, dataLabel) {
    const canvas = ctx.canvas;
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const barWidth = chartWidth / labels.length * 0.8;
    const barSpacing = chartWidth / labels.length * 0.2;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Encontrar valor máximo
    const maxValue = Math.max(...values.map(v => parseFloat(v)));
    
    // Dibujar ejes
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Dibujar barras
    labels.forEach((label, index) => {
        const x = padding + (barWidth + barSpacing) * index + barSpacing / 2;
        const barHeight = (values[index] / maxValue) * chartHeight;
        const y = canvas.height - padding - barHeight;
        
        // Color según el valor
        const percentage = parseFloat(values[index]);
        ctx.fillStyle = percentage >= 80 ? '#27ae60' : 
                       percentage >= 60 ? '#f39c12' : 
                       percentage >= 40 ? '#7f8c8d' : '#e74c3c';
        
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Etiqueta del valor
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(values[index] + '%', x + barWidth / 2, y - 5);
        
        // Etiqueta del tema
        ctx.save();
        ctx.translate(x + barWidth / 2, canvas.height - padding + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(label, 0, 0);
        ctx.restore();
    });
}

function drawPieChart(ctx, labels, values, colors) {
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calcular total
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) return;
    
    // Dibujar segmentos
    let currentAngle = -Math.PI / 2;
    
    values.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        // Dibujar segmento
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = colors[index];
        ctx.fill();
        
        // Dibujar etiqueta
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const percentage = ((value / total) * 100).toFixed(1);
        ctx.fillText(`${percentage}%`, labelX, labelY);
        
        currentAngle += sliceAngle;
    });
    
    // Leyenda
    const legendX = 20;
    let legendY = 20;
    
    labels.forEach((label, index) => {
        ctx.fillStyle = colors[index];
        ctx.fillRect(legendX, legendY, 15, 15);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(label, legendX + 20, legendY + 12);
        
        legendY += 25;
    });
}

function drawHistogram(ctx, bins, xLabel, yLabel) {
    const canvas = ctx.canvas;
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const binWidth = chartWidth / bins.length;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Encontrar valor máximo
    const maxCount = Math.max(...bins.map(bin => bin.count));
    
    // Dibujar ejes
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Dibujar barras
    ctx.fillStyle = '#3498db';
    bins.forEach((bin, index) => {
        const x = padding + binWidth * index;
        const barHeight = (bin.count / maxCount) * chartHeight;
        const y = canvas.height - padding - barHeight;
        
        ctx.fillRect(x, y, binWidth - 2, barHeight);
        
        // Etiqueta del rango
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${bin.min.toFixed(0)}-${bin.max.toFixed(0)}`, 
            x + binWidth / 2, 
            canvas.height - padding + 15
        );
    });
}

function createHistogramBins(data, numBins) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binSize = (max - min) / numBins;
    
    const bins = [];
    for (let i = 0; i < numBins; i++) {
        bins.push({
            min: min + i * binSize,
            max: min + (i + 1) * binSize,
            count: 0
        });
    }
    
    data.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), numBins - 1);
        bins[binIndex].count++;
    });
    
    return bins;
}