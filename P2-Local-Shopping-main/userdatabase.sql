-- Opret kun databasen, hvis den ikke allerede findes
CREATE DATABASE IF NOT EXISTS cs_25_sw_2_09;
USE cs_25_sw_2_09;

-- Opret kun tabellen, hvis den ikke allerede findes
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    firstname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
); 

-- Indsæt kun testbrugere, hvis de ikke allerede findes
-- INSERT IGNORE INTO users (firstname, email, password)

