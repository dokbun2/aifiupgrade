// AIFI Framework Admin Backend Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const statsRoutes = require('./routes/stats');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8000'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Static files (serve the frontend)
app.use(express.static(path.join(__dirname)));

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Public routes
app.use(`${apiPrefix}/auth`, authRoutes);

// Protected routes
app.use(`${apiPrefix}/users`, authenticateToken, usersRoutes);
app.use(`${apiPrefix}/products`, authenticateToken, productsRoutes);
app.use(`${apiPrefix}/orders`, authenticateToken, ordersRoutes);
app.use(`${apiPrefix}/stats`, authenticateToken, statsRoutes);

// Health check endpoint
app.get(`${apiPrefix}/health`, (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
    });
});

// Serve admin panel for /admin routes
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🚀 AIFI Admin Backend Server
    ================================
    Environment: ${process.env.NODE_ENV}
    Server URL: http://localhost:${PORT}
    API Base: http://localhost:${PORT}${apiPrefix}
    Admin UI: http://localhost:${PORT}/admin
    ================================
    `);
});