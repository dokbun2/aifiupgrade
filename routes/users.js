// Users routes
const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery } = require('../models/database');
const { requireAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res, next) => {
    try {
        const users = await getAll(
            'SELECT id, email, name, role, avatar, created_at, last_login FROM users'
        );
        res.json(users);
    } catch (error) {
        next(error);
    }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
    try {
        const user = await getOne(
            'SELECT id, email, name, role, avatar, created_at FROM users WHERE id = ?',
            [req.params.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
});

// Update user
router.put('/:id', async (req, res, next) => {
    try {
        const { name, email, role } = req.body;
        const userId = req.params.id;

        // Check if user can update (own profile or admin)
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await runQuery(
            'UPDATE users SET name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, email, role || 'user', userId]
        );

        res.json({ success: true, message: 'User updated' });
    } catch (error) {
        next(error);
    }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
    try {
        await runQuery('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;