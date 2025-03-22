const testNoBreaker = document.getElementById('test-no-breaker');
const testWithBreaker = document.getElementById('test-with-breaker');
const refreshStatus = document.getElementById('refresh-status');
const startAuto = document.getElementById('startAuto');
const stopAuto = document.getElementById('stopAuto');

const counterNoBreaker = document.getElementById('counter-no-breaker');
const counterWithBreaker = document.getElementById('counter-with-breaker');
const resultsNoBreaker = document.getElementById('results-no-breaker');
const resultsWithBreaker = document.getElementById('results-with-breaker');

const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const successCount = document.getElementById('success-count');
const failureCount = document.getElementById('failure-count');
const failureRate = document.getElementById('failure-rate');
const lastStateChange = document.getElementById('last-state-change');
const threshold = document.getElementById('threshold');
const cooldown = document.getElementById('cooldown');

let noBreakerCount = 0;
let withBreakerCount = 0;
let autoTestInterval = null;
let statusPollingInterval = null;

function updateCircuitBreakerStatus() {
    fetch('/circuit-breaker-status/custom')
        .then(response => response.json())
        .then(data => {
            statusIndicator.className = 'status-circle ' + data.state.toLowerCase();
            statusText.textContent = data.state;
            
            // successCount.textContent = data.successfulCalls || 0;
            failureCount.textContent = data.failureCount || 0;
            
            const totalCalls = data.totalCalls || 0;
            // const rate = totalCalls > 0 ? 
            //     ((data.failureCount / totalCalls) * 100).toFixed(1) : '0';
            // failureRate.textContent = `${rate}%`;
            
            threshold.textContent = data.threshold || 'N/A';
            cooldown.textContent = `${data.cooldown || 0}ms`;
            
            if (data.nextAttempt && data.state === 'OPEN') {
                const remainingTime = Math.max(0, data.nextAttempt - Date.now());
                lastStateChange.textContent = remainingTime > 0 ? 
                    `Cooldown termina en ${Math.ceil(remainingTime/1000)}s` : 
                    'Pendiente de prueba';
                
                if (remainingTime > 0 && remainingTime < 1500) {
                    setTimeout(updateCircuitBreakerStatus, remainingTime + 100);
                }
            } else {
                lastStateChange.textContent = data.state === 'CLOSED' ? 'Cerrado' : 
                    data.state === 'HALF-OPEN' ? 'En prueba' : '-';
            }
        })
        .catch(error => {
            console.error('Error al obtener el estado del circuit breaker:', error);
        });
}

function formatTimestamp() {
    return new Date().toLocaleTimeString();
}

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
            
            if (data.data && data.data.includes('alternative content')) {
                logEntry += `⚠️ FALLBACK: ${JSON.stringify(data)}\n`;
            } else {
                logEntry += `✅ ÉXITO: ${JSON.stringify(data)}\n`;
            }
            
            resultsWithBreaker.textContent = logEntry + resultsWithBreaker.textContent;
            updateCircuitBreakerStatus();
        })
        .catch(error => {
            const logEntry = `[${timestamp}] ❌ ERROR: ${error.message}\n`;
            resultsWithBreaker.textContent = logEntry + resultsWithBreaker.textContent;
            updateCircuitBreakerStatus();
        });
}

function startAutoTests() {
    if (!autoTestInterval) {
        autoTestInterval = setInterval(() => {
            testWithCircuitBreaker();
        }, 1000);
    }
}

function stopAutoTests() {
    if (autoTestInterval) {
        clearInterval(autoTestInterval);
        autoTestInterval = null;
    }
}

function startStatusPolling() {
    if (!statusPollingInterval) {
        statusPollingInterval = setInterval(updateCircuitBreakerStatus, 2000);
    }
}

function initApp() {
    updateCircuitBreakerStatus();
    startStatusPolling();
    
    testNoBreaker.addEventListener('click', testNoCircuitBreaker);
    testWithBreaker.addEventListener('click', testWithCircuitBreaker);
    refreshStatus.addEventListener('click', updateCircuitBreakerStatus);
    startAuto.addEventListener('click', startAutoTests);
    stopAuto.addEventListener('click', stopAutoTests);
}

document.addEventListener('DOMContentLoaded', initApp);