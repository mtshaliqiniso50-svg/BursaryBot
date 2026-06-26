const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '@SpheH2blevel4',
    database: process.env.DB_NAME || 'bursarybot_db',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 1,
    connectTimeout: 10000
});

async function migrateDatabase() {
    let connection;
    try {
        console.log('🚀 Starting BursaryBot Database Migration...\n');
        console.log(`📡 Connecting to MySQL81 at ${process.env.DB_HOST}:${process.env.DB_PORT}...`);
        
        // Get connection
        connection = await pool.getConnection();
        console.log('✅ Connected successfully!\n');

        const dbName = process.env.DB_NAME || 'bursarybot_db';
        
        // Create database if not exists
        console.log(`📦 Creating database '${dbName}' if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        await connection.query(`USE ${dbName}`);
        console.log(`✅ Using database: ${dbName}\n`);

        // Disable foreign key checks to drop tables safely
        console.log('📋 Dropping existing tables...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Get all tables
        const [tables] = await connection.query('SHOW TABLES');
        
        // Drop each table
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
            console.log(`   ✅ Dropped: ${tableName}`);
        }
        
        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ All tables dropped successfully\n');

        // ============================================
        // CREATE TABLES
        // ============================================
        console.log('📋 Creating tables...');

        // 1. Users Table
        await connection.query(`
            CREATE TABLE users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                profile_pic VARCHAR(255),
                role ENUM('student', 'admin') DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('  ✅ users table created');

        // 2. Student Profiles Table
        await connection.query(`
            CREATE TABLE student_profiles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT UNIQUE NOT NULL,
                full_name VARCHAR(100),
                field_of_study VARCHAR(100),
                institution VARCHAR(150),
                province VARCHAR(50),
                year_of_study INT DEFAULT 1,
                average_mark DECIMAL(5,2),
                parent_income DECIMAL(10,2),
                gender ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
                race VARCHAR(50),
                career_interests TEXT,
                skills TEXT,
                bio TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ student_profiles table created');

        // 3. Bursaries Table
        await connection.query(`
            CREATE TABLE bursaries (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(200) NOT NULL,
                provider VARCHAR(150) NOT NULL,
                description TEXT NOT NULL,
                field_of_study VARCHAR(100),
                min_average DECIMAL(5,2),
                max_income DECIMAL(10,2),
                province VARCHAR(50),
                deadline DATE,
                apply_link TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('  ✅ bursaries table created');

        // 4. Saved Bursaries Table
        await connection.query(`
            CREATE TABLE saved_bursaries (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                bursary_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (bursary_id) REFERENCES bursaries(id) ON DELETE CASCADE,
                UNIQUE KEY unique_save (user_id, bursary_id)
            )
        `);
        console.log('  ✅ saved_bursaries table created');

        // 5. Chat History Table
        await connection.query(`
            CREATE TABLE chat_history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ chat_history table created\n');

        // ============================================
        // INSERT SAMPLE DATA
        // ============================================
        console.log('📝 Inserting sample data...');

        // Insert Bursaries
        await connection.query(`
            INSERT INTO bursaries (name, provider, description, field_of_study, min_average, max_income, province, deadline, apply_link) VALUES
            ('IT Excellence Bursary 2026', 'TechSA', 'For high-achieving IT students pursuing software development careers. Covers tuition, books, and laptop.', 'IT', 65, 350000, 'Any', '2026-11-30', 'https://techsa.co.za'),
            ('Funza Lushaka Teaching Bursary', 'DBE', 'Teaching bursary for students pursuing education degrees.', 'Education', 60, 300000, 'Any', '2027-01-31', 'https://funzalushaka.doe.gov.za'),
            ('NSFAS Financial Aid', 'NSFAS', 'Financial support for students from low-income households.', 'All', 50, 350000, 'Any', '2027-01-31', 'https://nsfas.org.za'),
            ('Agriculture Development Fund', 'AgriSA', 'Supporting future farmers and agricultural specialists.', 'Agriculture', 60, 250000, 'Any', '2026-10-31', 'https://agrisa.co.za'),
            ('Public Service Bursary', 'DPSA', 'For students committed to public administration careers.', 'Public Management', 65, 300000, 'Any', '2026-12-15', 'https://dpsa.gov.za')
        `);
        console.log('  ✅ 5 bursaries inserted');

        // Insert Demo User (password: demo123)
        await connection.query(`
            INSERT INTO users (username, email, phone, password, role) VALUES
            ('demo_student', 'demo@bursarybot.com', '0712345678', '$2b$10$u4DN8jL6G0t7ObhAMc1L2.3/SXN8L8hgl/ried0EcKIDxBOMAGH5m', 'student')
        `);
        console.log('  ✅ Demo user inserted (username: demo_student, password: demo123)');

        // Insert Demo Student Profile
        await connection.query(`
            INSERT INTO student_profiles (user_id, full_name, field_of_study, institution, province, year_of_study, average_mark, parent_income) VALUES
            (1, 'Demo Student', 'IT', 'DUT', 'KwaZulu-Natal', 2, 68, 250000)
        `);
        console.log('  ✅ Demo student profile inserted\n');

        // ============================================
        // VERIFY DATABASE
        // ============================================
        console.log('📊 Verifying database...');
        
        const [tablesResult] = await connection.query('SHOW TABLES');
        console.log(`📋 Tables in database: ${tablesResult.length}`);
        
        let totalRows = 0;
        for (const table of tablesResult) {
            const tableName = Object.values(table)[0];
            const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`  - ${tableName}: ${count[0].count} rows`);
            totalRows += count[0].count;
        }

        // Show sample data
        console.log('\n📝 Sample Bursaries:');
        const [bursaries] = await connection.query('SELECT name, provider, deadline FROM bursaries LIMIT 3');
        bursaries.forEach(b => {
            console.log(`  - ${b.name} (${b.provider}) - Deadline: ${b.deadline}`);
        });

        console.log('\n👤 Demo User:');
        const [users] = await connection.query('SELECT username, email, role FROM users');
        users.forEach(u => {
            console.log(`  - ${u.username} (${u.email}) - Role: ${u.role}`);
        });

        console.log('\n🎓 Demo Student Profile:');
        const [profiles] = await connection.query(`
            SELECT u.username, p.full_name, p.field_of_study, p.institution 
            FROM users u 
            JOIN student_profiles p ON u.id = p.user_id
        `);
        profiles.forEach(p => {
            console.log(`  - ${p.full_name} - ${p.field_of_study} at ${p.institution}`);
        });

        // ============================================
        // SUCCESS MESSAGE
        // ============================================
        console.log('\n' + '═'.repeat(60));
        console.log('✅ MIGRATION COMPLETED SUCCESSFULLY! 🎉');
        console.log('═'.repeat(60));
        console.log(`📊 Database:     ${dbName}`);
        console.log(`🔗 Host:         ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        console.log(`📋 Tables:       ${tablesResult.length}`);
        console.log(`📝 Total Rows:   ${totalRows}`);
        console.log('═'.repeat(60));
        console.log('\n🔑 Demo Login Credentials:');
        console.log(`   Username: demo_student`);
        console.log(`   Password: demo123`);
        console.log('\n📱 Access URLs:');
        console.log(`   Local:    http://localhost:${process.env.PORT || 5000}`);
        console.log(`   Mobile:   http://localhost:${process.env.PORT || 5000}/api/mobile`);
        console.log('═'.repeat(60));

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.log('\n📌 Troubleshooting:');
        console.log('1. Make sure MySQL81 is running');
        console.log('2. Check credentials in .env file');
        console.log('3. Try running: mysql -u root -p');
        console.log('4. Check if database already exists');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n⚠️  Access denied! Check your DB_PASSWORD in .env');
        }
        if (error.code === 'ECONNREFUSED') {
            console.log('\n⚠️  Cannot connect to MySQL! Make sure MySQL81 is running.');
        }
    } finally {
        if (connection) {
            connection.release();
            console.log('\n🔌 Database connection closed.');
        }
        await pool.end();
    }
}

// Run migration
console.log('\n' + '═'.repeat(60));
migrateDatabase();