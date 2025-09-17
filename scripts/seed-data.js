// Seed database with sample data
require('dotenv').config();
const { runQuery, getOne } = require('../models/database');
const bcrypt = require('bcryptjs');

async function seedData() {
    try {
        console.log('Seeding database with sample data...');

        // Sample users
        const users = [
            { email: 'user1@example.com', name: 'Olivia Martin', role: 'user' },
            { email: 'user2@example.com', name: 'Jackson Lee', role: 'user' },
            { email: 'user3@example.com', name: 'Isabella Nguyen', role: 'user' },
            { email: 'user4@example.com', name: 'William Kim', role: 'user' },
            { email: 'user5@example.com', name: 'Sofia Davis', role: 'user' }
        ];

        for (const user of users) {
            const existing = await getOne('SELECT id FROM users WHERE email = ?', [user.email]);
            if (!existing) {
                const hashedPassword = await bcrypt.hash('password123', 10);
                await runQuery(
                    'INSERT INTO users (email, password, name, role, avatar) VALUES (?, ?, ?, ?, ?)',
                    [
                        user.email,
                        hashedPassword,
                        user.name,
                        user.role,
                        `https://ui-avatars.com/api/?name=${user.name.replace(' ', '+')}&background=${Math.floor(Math.random()*16777215).toString(16)}&color=fff`
                    ]
                );
            }
        }
        console.log('✅ Users seeded');

        // Sample products
        const products = [
            { name: 'Premium Widget', description: 'High-quality widget', price: 99.99, stock: 150, category: 'widgets' },
            { name: 'Pro Gadget', description: 'Professional gadget', price: 199.99, stock: 75, category: 'gadgets' },
            { name: 'Basic Tool', description: 'Essential tool', price: 29.99, stock: 500, category: 'tools' },
            { name: 'Advanced System', description: 'Complete system solution', price: 499.99, stock: 25, category: 'systems' },
            { name: 'Standard Package', description: 'Standard service package', price: 149.99, stock: 100, category: 'services' }
        ];

        for (const product of products) {
            await runQuery(
                'INSERT OR IGNORE INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)',
                [product.name, product.description, product.price, product.stock, product.category]
            );
        }
        console.log('✅ Products seeded');

        // Sample orders
        const orders = [
            { order_number: 'INV001', customer_name: 'Olivia Martin', customer_email: 'olivia.martin@email.com', total_amount: 1999.00, status: 'paid' },
            { order_number: 'INV002', customer_name: 'Jackson Lee', customer_email: 'jackson.lee@email.com', total_amount: 150.00, status: 'pending' },
            { order_number: 'INV003', customer_name: 'Isabella Nguyen', customer_email: 'isabella.nguyen@email.com', total_amount: 350.00, status: 'paid' },
            { order_number: 'INV004', customer_name: 'William Kim', customer_email: 'will@email.com', total_amount: 450.00, status: 'paid' },
            { order_number: 'INV005', customer_name: 'Sofia Davis', customer_email: 'sofia.davis@email.com', total_amount: 550.00, status: 'failed' }
        ];

        for (const order of orders) {
            const existing = await getOne('SELECT id FROM orders WHERE order_number = ?', [order.order_number]);
            if (!existing) {
                await runQuery(
                    'INSERT INTO orders (order_number, customer_name, customer_email, total_amount, status, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
                    [order.order_number, order.customer_name, order.customer_email, order.total_amount, order.status, 'credit_card']
                );
            }
        }
        console.log('✅ Orders seeded');

        // Sample sales
        const sales = [
            { customer_name: 'Olivia Martin', customer_email: 'olivia.martin@email.com', amount: 1999.00 },
            { customer_name: 'Jackson Lee', customer_email: 'jackson.lee@email.com', amount: 39.00 },
            { customer_name: 'Isabella Nguyen', customer_email: 'isabella.nguyen@email.com', amount: 299.00 },
            { customer_name: 'William Kim', customer_email: 'will@email.com', amount: 99.00 },
            { customer_name: 'Sofia Davis', customer_email: 'sofia.davis@email.com', amount: 39.00 }
        ];

        for (const sale of sales) {
            await runQuery(
                'INSERT INTO sales (customer_name, customer_email, amount) VALUES (?, ?, ?)',
                [sale.customer_name, sale.customer_email, sale.amount]
            );
        }
        console.log('✅ Sales seeded');

        // Sample stats
        const stats = [
            { metric_name: 'total_revenue', metric_value: '45231.89', metric_type: 'currency' },
            { metric_name: 'new_subscriptions', metric_value: '2350', metric_type: 'count' },
            { metric_name: 'total_sales', metric_value: '12234', metric_type: 'count' },
            { metric_name: 'active_users', metric_value: '573', metric_type: 'count' },
            { metric_name: 'revenue_growth', metric_value: '20.1', metric_type: 'percentage' },
            { metric_name: 'subscription_growth', metric_value: '180.1', metric_type: 'percentage' }
        ];

        for (const stat of stats) {
            await runQuery(
                'INSERT OR REPLACE INTO stats (metric_name, metric_value, metric_type) VALUES (?, ?, ?)',
                [stat.metric_name, stat.metric_value, stat.metric_type]
            );
        }
        console.log('✅ Stats seeded');

        console.log('✅ Database seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedData();