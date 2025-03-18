// Elementos DOM
const testNoBreaker = document.getElementById('test-no-breaker');
const testWithBreaker = document.getElementById('test-with-breaker');
const refreshStatus = document.getElementById('refresh-status');

const counterNoBreaker = document.getElementById('counter-no-breaker');
const counterWithBreaker = document.getElementById('counter-with-breaker');
const resultsNoBreaker = document.getElementById('results-no-breaker');
const resultsWithBreaker = document.getElementById('results-with-breaker');


// Elementos de estado
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const successCount = document.getElementById('success-count');
const failureCount = document.getElementById('failure-count');
const failureRate = document.getElementById('failure-rate');
const lastStateChange = document.getElementById('last-state-change');
const threshold = document.getElementById('threshold');
const cooldown = document.getElementById('cooldown');


// Contadores
let noBreakerCount = 0;
let withBreakerCount = 0;
let autoTestInterval = null;

// Función para actualizar la interfaz de estado del Circuit Breaker
function updateCircuitBreakerStatus() {
    fetch('/circuit-breaker-status/custom')
        .then(response => response.json())
        .then(data => {
            console.log('Circuit breaker status:', data);
            
            // Actualizar indicador visual
            statusIndicator.className = 'status-circle ' + data.state.toLowerCase();
            statusText.textContent = data.state;
            
            // Actualizar estadísticas
            // Usar successfulCalls en lugar de successCount que no existe en tu implementación
            successCount.textContent = data.successfulCalls || 0;
            failureCount.textContent = data.failureCount || 0;
            
            // Calcular tasa de fallos
            const totalCalls = data.totalCalls || 0;
            const rate = totalCalls > 0 ? 
                ((data.failureCount / totalCalls) * 100).toFixed(1) : '0';
            failureRate.textContent = `${rate}%`;
            
            // Actualizar configuración
            threshold.textContent = data.threshold || 'N/A';
            cooldown.textContent = `${data.cooldown || 0}ms`;
            
            // Mostrar tiempo restante o última vez que cambió de estado
            // Tu implementación no tiene lastStateChange, pero tiene nextAttempt
            if (data.nextAttempt && data.state === 'OPEN') {
                const remainingTime = Math.max(0, data.nextAttempt - Date.now());
                lastStateChange.textContent = remainingTime > 0 ? 
                    `Se abrirá en ${Math.ceil(remainingTime/1000)}s` : 
                    'Pendiente de prueba';
            } else {
                lastStateChange.textContent = data.state === 'CLOSED' ? 'Cerrado' : 
                    data.state === 'HALF-OPEN' ? 'En prueba' : '-';
            }
        })
        .catch(error => {
            console.error('Error al obtener el estado del circuit breaker:', error);
        });
}

// Formatear fecha para log
function formatTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString();
}

// Función para llamar al endpoint sin circuit breaker
function testNoCircuitBreaker() {
    const timestamp = formatTimestamp();
    noBreakerCount++;
    counterNoBreaker.textContent = `${noBreakerCount} solicitudes`;
    
    fetch('/no-circuit-breaker')
        .then(response => {
            if (!response.ok) {
                throw new Error(`${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const logEntry = `[${timestamp}] ✅ ÉXITO: ${JSON.stringify(data)}\n`;
            resultsNoBreaker.textContent = logEntry + resultsNoBreaker.textContent;
        })
        .catch(error => {
            const logEntry = `[${timestamp}] ❌ ERROR: ${error.message}\n`;
            resultsNoBreaker.textContent = logEntry + resultsNoBreaker.textContent;
        });
}

// Función para llamar al endpoint con circuit breaker
function testWithCircuitBreaker() {
    const timestamp = formatTimestamp();
    withBreakerCount++;
    counterWithBreaker.textContent = `${withBreakerCount} solicitudes`;
    
    fetch('/with-circuit-breaker')
        .then(response => {
            if (!response.ok) {
                throw new Error(`${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            let logEntry = `[${timestamp}] `;
            
            // Verificar si estamos obteniendo el contenido de fallback
            if (data.data && data.data.includes('alternative content')) {
                logEntry += `⚠️ FALLBACK: ${JSON.stringify(data)}\n`;
            } else {
                logEntry += `✅ ÉXITO: ${JSON.stringify(data)}\n`;
            }
            
            resultsWithBreaker.textContent = logEntry + resultsWithBreaker.textContent;
            updateCircuitBreakerStatus(); // Actualizar el estado después de cada llamada
        })
        .catch(error => {
            const logEntry = `[${timestamp}] ❌ ERROR: ${error.message}\n`;
            resultsWithBreaker.textContent = logEntry + resultsWithBreaker.textContent;
            updateCircuitBreakerStatus(); // Actualizar el estado después de cada error
        });
}


// Inicializar la aplicación
function initApp() {
    // Cargar el estado inicial del Circuit Breaker
    updateCircuitBreakerStatus();
    
    // Agregar event listeners
    testNoBreaker.addEventListener('click', testNoCircuitBreaker);
    testWithBreaker.addEventListener('click', testWithCircuitBreaker);
    refreshStatus.addEventListener('click', updateCircuitBreakerStatus);
    startAuto.addEventListener('click', startAutoTests);
    stopAuto.addEventListener('click', stopAutoTests);
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);