-- Opret kun databasen, hvis den ikke allerede findes
-- CREATE DATABASE IF NOT EXISTS cs_25_sw_2_09;
-- USE cs_25_sw_2_09;

-- Opret kun tabellen, hvis den ikke allerede findes (Users)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    firstname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Opret kun tabellen, hvis den ikke allerede findes (Products)
CREATE TABLE IF NOT EXISTS Product (
    Product_ID INTEGER PRIMARY KEY AUTO_INCREMENT,
    Product_name VARCHAR(255) NOT NULL,
    Quantity INTEGER NOT NULL,
    Category_ID INTEGER NOT NULL,
    Store_ID INTEGER NOT NULL,
    Description TEXT NOT NULL,
    Price DECIMAL(10, 2) NOT NULL
);

-- Opret kun tabellen, hvis den ikke allerede findes (Categories)
CREATE TABLE IF NOT EXISTS Categories (
    Category_ID INTEGER PRIMARY KEY AUTO_INCREMENT,
    Category_name VARCHAR(255) NOT NULL
);

-- Opret kun tabellen, hvis den ikke allerede findes (Stores)
CREATE TABLE IF NOT EXISTS Store (
    Store_ID INTEGER PRIMARY KEY AUTO_INCREMENT,
    Store_name VARCHAR(255) NOT NULL,
    Store_address VARCHAR(255) NOT NULL,
    Store_description TEXT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL
    image VARCHAR(255)
);

