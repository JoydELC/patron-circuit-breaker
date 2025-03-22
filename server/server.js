const express = require('express');
const path = require('path');
const app = express();
const {CircuitBreaker} = require('./circuitBreaker');
const axios = require('axios');
const config = require('./config');

app.use(express.static(path.join(__dirname, '..', 'public')));

// // API Mock
// app.get('/api',
//     async (req,res)=> {
//         if(Math.random()> config.API_FAILURE_RATE){
//             res.json({data: 'Success'});
//         } else {
//             res.status(500).json({error:'Error with API'});
//         }
//     }
// );

// API Mock with deterministic behavior pattern
let requestCounter = 0;

app.get('/api', async (req, res) => {
    requestCounter++;
    
    if (requestCounter <= 3) {
        return res.status(500).json({ error: 'Error with API' });
    }
    
    if (requestCounter <= 8) {
        return res.json({ data: 'Success' });
    }
    
    requestCounter = 0;
    return res.status(500).json({ error: 'Error with API' });
});


//Middleware for handling errors
const errorHandler = (err, req, res, next) => {
    console.error(`Error: ${err.message}`);
    res.status(err.status || 500).json({
        error: err.message || 'Internal error from server'
    });
}

// Without Circuit Breaker
app.get('/no-circuit-breaker',
    async (req, res, next) => {
        try{
        const response = await axios.get(`${config.API_URL}/api`);
        res.json(response.data);
    }
    catch(error){
        next({
            message: 'Error without circuit breaker',
            status: 500,
            originalError: error
        });
    }
    }
);


// With Circuit breaker Custom 
const customBreaker = new CircuitBreaker({
    action: () => axios.get(`${config.API_URL}/api`),
    fallback: { data: 'Service not available. Using alternative content' },
    threshold: config.CIRCUIT_BREAKER_THRESHOLD,
    cooldown: config.CIRCUIT_BREAKER_COOLDOWN,
    timeout: config.CIRCUIT_BREAKER_TIMEOUT,
    name: 'api-service'
});

app.get('/with-circuit-breaker', async (req, res, next) => {
    try {
        const result = await customBreaker.fire();
        res.json(result);
    } catch (error) {
        next({
            message: error.message,
            status: 500,
            originalError: error
        });
    }
});
app.get('/', (req, res) => {
    res.sendFile(path.join( __dirname, '..','public', 'index.html'));
  });
//Endpoint for verifying the status of the circuit breaker
app.get('/circuit-breaker-status/custom', (req, res) => {
    res.json(customBreaker.getStats());
});
app.use(express.json());
app.use(errorHandler);



const PORT = process.env.PORT || config.PORT
app.listen(PORT, ()=> console.log(`Server runing on PORT ${PORT}`));