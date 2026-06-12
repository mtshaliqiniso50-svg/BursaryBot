-- Create new database for BursaryBot
CREATE DATABASE IF NOT EXISTS bursarybot_db;
USE bursarybot_db;

-- Users Table
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
);

-- Student Profiles Table
CREATE TABLE student_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(100),
    field_of_study VARCHAR(100)
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
);

-- Chat History Table
CREATE TABLE chat_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bursaries Table (Internal)
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
);

-- Saved Bursaries Table
CREATE TABLE saved_bursaries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    bursary_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bursary_id) REFERENCES bursaries(id) ON DELETE CASCADE,
    UNIQUE KEY unique_save (user_id, bursary_id)
);

-- Insert Sample Bursaries
INSERT INTO bursaries (name, provider, description, field_of_study, min_average, max_income, province, deadline, apply_link) VALUES
('IT Excellence Bursary 2026', 'TechSA', 'For high-achieving IT students pursuing software development careers. Covers tuition, books, and laptop.', 'IT', 65, 350000, 'Any', '2026-11-30', 'https://techsa.co.za'),
('Funza Lushaka Teaching Bursary', 'DBE', 'Teaching bursary for students pursuing education degrees.', 'Education', 60, 300000, 'Any', '2027-01-31', 'https://funzalushaka.doe.gov.za'),
('NSFAS Financial Aid', 'NSFAS', 'Financial support for students from low-income households.', 'All', 50, 350000, 'Any', '2027-01-31', 'https://nsfas.org.za'),
('Agriculture Development Fund', 'AgriSA', 'Supporting future farmers and agricultural specialists.', 'Agriculture', 60, 250000, 'Any', '2026-10-31', 'https://agrisa.co.za'),
('Public Service Bursary', 'DPSA', 'For students committed to public administration careers.', 'Public Management', 65, 300000, 'Any', '2026-12-15', 'https://dpsa.gov.za');

-- Insert Demo User (password: demo123)
INSERT INTO users (username, email, phone, password, role) VALUES
('demo_student', 'demo@bursarybot.com', '0712345678', '$2b$10$u4DN8jL6G0t7ObhAMc1L2.3/SXN8L8hgl/ried0EcKIDxBOMAGH5m', 'student');

-- Insert Demo Profile
INSERT INTO student_profiles (user_id, full_name, field_of_study, institution, province, year_of_study, average_mark, parent_income) VALUES
(1, 'Demo Student', 'IT', 'DUT', 'KwaZulu-Natal', 2, 68, 250000);

SELECT '✅ BursaryBot Database Created Successfully!' as Status;
SELECT COUNT(*) as TotalBursaries FROM bursaries;