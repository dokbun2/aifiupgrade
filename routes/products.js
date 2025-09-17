// Products routes
const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery } = require('../models/database');

// Get all products
router.get('/', async (req, res, next) => {
    try {
        const products = await getAll('SELECT * FROM products WHERE status = "active"');
        res.json(products);
    } catch (error) {
        next(error);
    }
});

// Get product by ID
router.get('/:id', async (req, res, next) => {
    try {
        const product = await getOne(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        next(error);
    }
});

// Create product
router.post('/', async (req, res, next) => {
    try {
        const { name, description, price, stock, category } = req.body;

        const result = await runQuery(
            `INSERT INTO products (name, description, price, stock, category)
             VALUES (?, ?, ?, ?, ?)`,
            [name, description, price, stock || 0, category]
        );

        res.status(201).json({ success: true, id: result.id });
    } catch (error) {
        next(error);
    }
});

// Update product
router.put('/:id', async (req, res, next) => {
    try {
        const { name, description, price, stock, category, status } = req.body;

        await runQuery(
            `UPDATE products
             SET name = ?, description = ?, price = ?, stock = ?, category = ?, status = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name, description, price, stock, category, status || 'active', req.params.id]
        );

        res.json({ success: true, message: 'Product updated' });
    } catch (error) {
        next(error);
    }
});

// Delete product
router.delete('/:id', async (req, res, next) => {
    try {
        // Soft delete by setting status to inactive
        await runQuery(
            'UPDATE products SET status = "inactive" WHERE id = ?',
            [req.params.id]
        );

        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;