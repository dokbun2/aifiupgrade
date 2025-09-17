// Stats routes for dashboard
const express = require('express');
const router = express.Router();
const { getAll, getOne } = require('../models/database');

// Get dashboard stats
router.get('/dashboard', async (req, res, next) => {
    try {
        // Get all stats
        const stats = await getAll(
            `SELECT * FROM stats WHERE date = DATE('now') OR metric_type = 'currency' OR metric_type = 'count'`
        );

        // Get recent sales
        const recentSales = await getAll(
            `SELECT * FROM sales ORDER BY created_at DESC LIMIT 5`
        );

        // Get recent orders
        const recentOrders = await getAll(
            `SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`
        );

        // Calculate some real-time stats
        const totalRevenue = await getOne(
            `SELECT SUM(total_amount) as total FROM orders WHERE status = 'paid'`
        );

        const totalUsers = await getOne(
            `SELECT COUNT(*) as count FROM users WHERE role = 'user'`
        );

        const activeUsers = await getOne(
            `SELECT COUNT(*) as count FROM users WHERE datetime(last_login) > datetime('now', '-1 hour')`
        );

        const totalOrders = await getOne(
            `SELECT COUNT(*) as count FROM orders`
        );

        // Format response
        const response = {
            stats: {
                totalRevenue: totalRevenue?.total || 0,
                totalUsers: totalUsers?.count || 0,
                activeUsers: activeUsers?.count || 0,
                totalOrders: totalOrders?.count || 0,
                revenueGrowth: 20.1,
                userGrowth: 180.1,
                salesGrowth: 19.0,
                activeGrowth: 201
            },
            recentSales,
            recentOrders,
            customStats: stats.reduce((acc, stat) => {
                acc[stat.metric_name] = {
                    value: stat.metric_value,
                    type: stat.metric_type
                };
                return acc;
            }, {})
        };

        res.json(response);
    } catch (error) {
        next(error);
    }
});

// Get chart data
router.get('/chart/:period', async (req, res, next) => {
    try {
        const { period } = req.params;
        let days = 7; // Default to 7 days

        switch (period) {
            case 'week':
                days = 7;
                break;
            case 'month':
                days = 30;
                break;
            case 'year':
                days = 365;
                break;
        }

        // Generate sample chart data
        const chartData = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            chartData.push({
                date: date.toISOString().split('T')[0],
                revenue: Math.floor(Math.random() * 5000) + 1000,
                orders: Math.floor(Math.random() * 100) + 20,
                users: Math.floor(Math.random() * 50) + 10
            });
        }

        res.json({
            period,
            data: chartData
        });
    } catch (error) {
        next(error);
    }
});

// Get activity feed
router.get('/activity', async (req, res, next) => {
    try {
        // Get recent activities (combining different tables)
        const activities = await getAll(`
            SELECT
                'order' as type,
                'New order placed' as action,
                customer_name as actor,
                total_amount as value,
                created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 10
        `);

        res.json(activities);
    } catch (error) {
        next(error);
    }
});

module.exports = router;