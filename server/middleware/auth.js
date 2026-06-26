const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Check if it's a Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Use Bearer token.'
            });
        }

        // Extract token
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token is empty.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request
        req.user = decoded;
        
        // Log for debugging (optional)
        console.log(`✅ Auth successful for user: ${decoded.username || decoded.id}`);

        next();

    } catch (error) {
        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        if (error.name === 'NotBeforeError') {
            return res.status(401).json({
                success: false,
                message: 'Token not active yet.'
            });
        }

        // Generic error
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed. Please login again.'
        });
    }
};

module.exports = auth;