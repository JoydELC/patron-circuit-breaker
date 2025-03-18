# Implementación del Patrón Circuit Breaker

## Descripción de la prueba

Esta prueba de concepto implementa el patrón de diseño **Circuit Breaker** (Interruptor de Circuito) en Node.js para demostrar cómo prevenir fallos en cascada en sistemas distribuidos. 

El proyecto contiene una implementación del Circuit Breaker que monitorea las llamadas a un API simulado y maneja los fallos de manera elegante, cambiando entre tres estados:
- **CLOSED**: Operación normal, las solicitudes pasan al servicio.
- **OPEN**: Circuito abierto, las solicitudes retornan inmediatamente una respuesta alternativa.
- **HALF-OPEN**: Probando recuperación, permite un número limitado de solicitudes para determinar si el servicio se ha recuperado.

## Objetivo(s) de la prueba

1. Demostrar la implementación práctica del patrón Circuit Breaker en Node.js.
2. Comparar el comportamiento de un sistema con y sin la protección del Circuit Breaker.
3. Visualizar el cambio de estados del Circuit Breaker en respuesta a fallos del servicio.

## Pasos implementados para llevar a cabo la prueba
  
1. **Diseño e implementación del Circuit Breaker**:
   - Creación de la clase `CircuitBreaker` con configuración parametrizable.
   - Implementación de los tres estados del patrón y la lógica de transición entre ellos.
   - Desarrollo de mecanismos para monitorear intentos fallidos y exitosos.

2. **Creación de un API simulado para pruebas**:
   - Implementación de un endpoint `/api` que falla aleatoriamente según una tasa configurable.
   - Desarrollo de endpoints con y sin protección del Circuit Breaker para comparación.

3. **Desarrollo de interfaz para visualización**:
   - Creación de una interfaz web simple para visualizar el comportamiento del patrón.
   - Implementación de un endpoint para monitorear el estado actual del Circuit Breaker.

## Tecnologías usadas en la prueba

### Lenguajes:
- JavaScript (Node.js)
- HTML/CSS (Frontend)

### Librerías y Frameworks:
- **Express.js**: Framework para crear el servidor web y API
- **Axios**: Cliente HTTP para realizar peticiones al API simulado
- **Tailwind CSS**: Framework CSS utilizado en la interfaz de usuario
- **Node.js**: Entorno de ejecución para JavaScript en el servidor

### Herramientas:
- **NPM**: Gestor de paquetes para Node.js
- **Git**: Sistema de control de versiones

## Resultados

La implementación del patrón Circuit Breaker ha demostrado ser efectiva en:

1. **Prevención de fallos en cascada**: Cuando el API simulado comienza a fallar, el Circuit Breaker se abre después de alcanzar el umbral de fallos configurado (3 por defecto), evitando más llamadas al servicio fallido.

2. **Recuperación automática**: Después del período de enfriamiento (10 segundos por defecto), el Circuit Breaker pasa al estado HALF-OPEN y realiza llamadas de prueba para verificar si el servicio se ha recuperado.

3. **Respuesta rápida durante fallos**: Cuando el circuito está abierto, las solicitudes reciben inmediatamente la respuesta alternativa configurada, sin tener que esperar a que se agote el tiempo de espera del servicio fallido.

4. **Monitoreo del estado**: El endpoint de estado proporciona información detallada sobre el Circuit Breaker:
   - Estado actual (CLOSED, OPEN, HALF-OPEN)
   - Conteo de fallos
   - Umbral configurado
   - Tiempo restante antes del próximo intento
   - Tasa de éxito
   - Total de llamadas
   - Último error registrado

5. **Comparación con/sin Circuit Breaker**: Las pruebas muestran que el endpoint sin protección sigue intentando llamar al API fallido, resultando en tiempos de respuesta lentos y errores constantes, mientras que el endpoint protegido devuelve rápidamente la respuesta alternativa.

## Conclusiones

1. **Eficacia del patrón**: El patrón Circuit Breaker demuestra ser altamente efectivo para mejorar la resiliencia de sistemas que dependen de servicios externos, previniendo fallos en cascada y permitiendo degradación elegante del servicio.

2. **Ventajas de implementación**:
   - Reduce carga en servicios con problemas, permitiéndoles recuperarse
   - Proporciona respuestas rápidas incluso cuando los servicios dependientes fallan
   - Permite recuperación automática sin intervención manual
   - Proporciona información valiosa sobre estado y salud de los servicios
  
## Interfaz
![image](https://github.com/user-attachments/assets/e01dd9e6-08cf-43e1-99ac-cd2cdbb77c7c)


3. **Consideraciones de configuración**:
   - El umbral de fallos y tiempo de enfriamiento deben ajustarse según el contexto específico
   - La elección de una respuesta alternativa adecuada es crucial para mantener la funcionalidad básica
