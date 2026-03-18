/**
 * SECURE SECURITY LOGGER
 * ----------------------
 * Provides visibility into clinical access, auth events, 
 * and potential abuse patterns for Railway/Cloud logging.
 */

export const securityLog = (req, eventType, details = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        eventType, // e.g., 'AUTH_SUCCESS', 'AUTH_FAILURE', 'IDOR_ATTEMPT', 'DATA_ACCESS'
        ip: req.ip || req.headers['x-forwarded-for'],
        method: req.method,
        path: req.originalUrl,
        user: req.user ? { id: req.user.id, role: req.user.role } : 'anonymous',
        ...details
    };

    // In a production environment, this would go to a service like Datadog/Sentry
    // For Railway, console.log captures structured JSON for searching.
    console.log(`[SECURITY_AUDIT] ${JSON.stringify(logEntry)}`);
};

export const errorLog = (err, req, res, next) => {
    const errorEntry = {
        timestamp: new Date().toISOString(),
        type: 'INTERNAL_ERROR',
        message: err.message,
        stack: err.stack,
        ip: req.ip,
        path: req.originalUrl,
        user: req.user ? req.user.id : 'anonymous'
    };

    console.error(`[CRITICAL_ERROR] ${JSON.stringify(errorEntry)}`);
    res.status(500).json({ error: 'Clinical Server Error. Incident reported.' });
};
