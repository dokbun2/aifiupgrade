// Orders routes
const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery } = require('../models/database');

// Get all orders
router.get('/', async (req, res, next) => {
    try {
        const orders = await getAll(`
            SELECT * FROM orders
            ORDER BY created_at DESC
        `);
        res.json(orders);
    } catch (error) {
        next(error);
    }
});

// Get order by ID
router.get('/:id', async (req, res, next) => {
    try {
        const order = await getOne(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order items
        const items = await getAll(
            `SELECT oi.*, p.name as product_name
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [req.params.id]
        );

        order.items = items;
        res.json(order);
    } catch (error) {
        next(error);
    }
});

// Create order
router.post('/', async (req, res, next) => {
    try {
        const {
            customer_name,
            customer_email,
            total_amount,
            payment_method,
            shipping_address,
            items
        } = req.body;

        // Generate order number
        const orderNumber = 'INV' + Date.now().toString().slice(-6);

        const result = await runQuery(
            `INSERT INTO orders (order_number, customer_name, customer_email, total_amount,
                               payment_method, shipping_address, status, user_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                orderNumber,
                customer_name,
                customer_email,
                total_amount,
                payment_method,
                shipping_address,
                'pending',
                req.user.id
            ]
        );

        // Add order items if provided
        if (items && items.length > 0) {
            for (const item of items) {
                await runQuery(
                    `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
                     VALUES (?, ?, ?, ?, ?)`,
                    [result.id, item.product_id, item.quantity, item.price, item.subtotal]
                );
            }
        }

        res.status(201).json({ success: true, id: result.id, order_number: orderNumber });
    } catch (error) {
        next(error);
    }
});

// Update order status
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'failed'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await runQuery(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, req.params.id]
        );

        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        next(error);
    }
});

// Delete order
router.delete('/:id', async (req, res, next) => {
    try {
        await runQuery('DELETE FROM orders WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Order deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;