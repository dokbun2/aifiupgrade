// Authentication routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getOne, runQuery } = require('../models/database');
const { generateToken, comparePassword, hashPassword } = require('../middleware/auth');

// Login endpoint
router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res, next) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Find user
            const user = await getOne(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (!user) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    message: 'Email or password is incorrect'
                });
            }

            // Verify password
            const isValidPassword = await comparePassword(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    message: 'Email or password is incorrect'
                });
            }

            // Update last login
            await runQuery(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );

            // Generate token
            const token = generateToken(user);

            // Remove password from user object
            delete user.password;

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// Register endpoint
router.post('/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('name').notEmpty().trim()
    ],
    async (req, res, next) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, name } = req.body;

            // Check if user exists
            const existingUser = await getOne(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUser) {
                return res.status(400).json({
                    error: 'User already exists',
                    message: 'An account with this email already exists'
                });
            }

            // Hash password
            const hashedPassword = await hashPassword(password);

            // Create user
            const result = await runQuery(
                `INSERT INTO users (email, password, name, role, avatar)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    email,
                    hashedPassword,
                    name,
                    'user',
                    `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=6366f1&color=fff`
                ]
            );

            const newUser = {
                id: result.id,
                email,
                name,
                role: 'user'
            };

            // Generate token
            const token = generateToken(newUser);

            res.status(201).json({
                success: true,
                token,
                user: newUser
            });
        } catch (error) {
            next(error);
        }
    }
);

// Refresh token endpoint
router.post('/refresh', async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                error: 'Token required',
                message: 'Refresh token is required'
            });
        }

        // Verify existing token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    error: 'Invalid token',
                    message: 'Refresh token is invalid or expired'
                });
            }

            // Get fresh user data
            const user = await getOne(
                'SELECT id, email, name, role FROM users WHERE id = ?',
                [decoded.id]
            );

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    message: 'User no longer exists'
                });
            }

            // Generate new token
            const newToken = generateToken(user);

            res.json({
                success: true,
                token: newToken
            });
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;