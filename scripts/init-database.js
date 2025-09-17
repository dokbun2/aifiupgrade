// Initialize database and create tables
require('dotenv').config();
const { createTables } = require('../models/database');
const bcrypt = require('bcryptjs');
const { runQuery } = require('../models/database');

async function initDatabase() {
    try {
        console.log('Initializing database...');

        // Create tables
        await createTables();

        // Create default admin user
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@aififramework.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Check if admin already exists
        const checkAdmin = `SELECT id FROM users WHERE email = ?`;
        const { getOne } = require('../models/database');
        const existingAdmin = await getOne(checkAdmin, [adminEmail]);

        if (!existingAdmin) {
            const insertAdmin = `
                INSERT INTO users (email, password, name, role, avatar)
                VALUES (?, ?, ?, ?, ?)
            `;

            await runQuery(insertAdmin, [
                adminEmail,
                hashedPassword,
                'Administrator',
                'admin',
                'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff'
            ]);

            console.log(`✅ Admin user created: ${adminEmail}`);
        } else {
            console.log('Admin user already exists');
        }

        console.log('✅ Database initialized successfully!');
        console.log(`Admin credentials: ${adminEmail} / ${adminPassword}`);
        console.log('⚠️  Remember to change these credentials in production!');

        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDatabase();