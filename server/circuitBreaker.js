/** 
 * Implementation of a circuit breaker pattern to handle calls and prevent failures
 * on other sistems
 * */ 

class CircuitBreaker {
    /**
     * @param {Object} options - Set up options
     * @param {Function} options.action - Function to execute (must return a promise)
     * @param {*} options.fallback - Return value when open circuit
     * @param {number} options.threshold - Failure atemps before opening circuit
     * @param {number} options.cooldown - Time before semi-Open
     * @param {number} options.timeout - Max time for timeout
     * @param {string} options.name - Circuit breaker name
     */
    constructor({ 
        action, 
        fallback, 
        threshold = 3, 
        cooldown = 10000, 
        timeout = 5000,
        name = 'default'
    }){
        if (typeof action !== 'function') {
            throw new Error('La acción debe ser una función');
        }
        
        this.action = action;
        this.fallback = fallback;
        this.threshold = threshold;
        this.cooldown = cooldown;
        this.timeout = timeout;
        this.name = name;
        
        // internal states
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.nextAttempt = Date.now();
        this.successCount = 0;
        this.lastError = null;
        this.totalCalls = 0;
        this.successfulCalls = 0;

        //States Const
        this.STATES = {
            CLOSED: 'CLOSED',
            OPEN: 'OPEN',
            HALF_OPEN: 'HALF-OPEN'
        };
        
        
        this.successThreshold = 2;
        
        console.log(`Circuit Breaker "${this.name}" created with threshold=${threshold}, cooldown=${cooldown}ms`);
    }

  /**
     * circuit breaker action
     * @returns {Promise} Result  action or fallback
     */
  async fire() {
    this.totalCalls++;
    
    // Verify the circuit is open
    if (this.state === this.STATES.OPEN) {
        if (this.nextAttempt <= Date.now()) {
            console.log(`Circuit Breaker "${this.name}": updating HALF-OPEN for test`);
            this.state = this.STATES.HALF_OPEN;
        } else {
            console.log(`Circuit Breaker "${this.name}": circuit OPEN, using fallback`);
            return this.fallback;
        }
    }
    
    try {
        // Executing action with timeout
        const result = await this._executeWithTimeout();
        
        // Managing succes
        if (this.state === this.STATES.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this.reset();
                console.log(`Circuit Breaker "${this.name}": reset after ${this.successThreshold} success`);
            }
        } else {
            this.reset();
        }
        
        this.successfulCalls++;
        return result.data;
    } catch (error) {
        this.lastError = error;
        
        this.failureCount++;
        console.log(`Circuit Breaker "${this.name}": fail #${this.failureCount}/${this.threshold}`);
        
        if (this.failureCount >= this.threshold) {
            this.open();
        }
        
        throw error;
    }
}

/**
 * Executing action
 * @private
 * @returns {Promise} Action esult
 */
async _executeWithTimeout() {
    return Promise.race([
        this.action(),
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Timeout after ${this.timeout}ms`));
            }, this.timeout);
        })
    ]);
}

/**
 * Reset
 */
reset() {
    this.failureCount = 0;
    this.successCount = 0;
    this.state = this.STATES.CLOSED;
}

/**
 * Open
 */
open() {
    this.state = this.STATES.OPEN;
    this.nextAttempt = Date.now() + this.cooldown;
    console.log(`Circuit Breaker "${this.name}": Open till ${new Date(this.nextAttempt).toISOString()}`);
    
    
    setTimeout(() => {
        if (this.state === this.STATES.OPEN) {
            this.state = this.STATES.HALF_OPEN;
            console.log(`Circuit Breaker "${this.name}": auto-transition to HALF-OPEN`);
        }
    }, this.cooldown + 100); 
}

/**
 * Stats
 * @returns {Object} Actual data
 */
getStats() {
    return {
        name: this.name,
        state: this.state,
        failureCount: this.failureCount,
        threshold: this.threshold,
        nextAttempt: this.nextAttempt,
        cooldown: this.cooldown,
        remainingTime: Math.max(0, this.nextAttempt - Date.now()),
        successRate: this.totalCalls > 0 ? (this.successfulCalls / this.totalCalls * 100).toFixed(2) + '%' : 'N/A',
        totalCalls: this.totalCalls,
        lastError: this.lastError ? this.lastError.message : null
    };
}
}

module.exports = { CircuitBreaker };