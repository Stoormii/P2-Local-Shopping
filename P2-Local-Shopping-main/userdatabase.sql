-- Opret kun databasen, hvis den ikke allerede findes
-- CREATE DATABASE IF NOT EXISTS cs_25_sw_2_09;
-- USE cs_25_sw_2_09;

-- Opret kun tabellen, hvis den ikke allerede findes (Users)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    firstname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL
);

-- Opret kun tabellen, hvis den ikke allerede findes (Products)
CREATE TABLE IF NOT EXISTS Product (
    Product_ID INTEGER PRIMARY KEY AUTO_INCREMENT,
    Product_name VARCHAR(255) NOT NULL,
    Quantity INTEGER NOT NULL,
    Category_ID INTEGER NOT NULL,
    Store_ID INTEGER NOT NULL,
    Description TEXT NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(255) 
);

-- Opret kun tabellen, hvis den ikke allerede findes (Categories)
CREATE TABLE IF NOT EXISTS Categories (
  Category_ID INTEGER PRIMARY KEY AUTO_INCREMENT,
  Category_name VARCHAR(255) NOT NULL,
  Parent_ID    INTEGER NULL,
  FOREIGN KEY (Parent_ID) REFERENCES Categories(Category_ID)
);


-- Opret kun tabellen, hvis den ikke allerede findes (Stores)
CREATE TABLE IF NOT EXISTS Store (
    Store_ID INTEGER PRIMARY KEY AUTO_INCREMENT,
    Store_name VARCHAR(255) NOT NULL,
    Store_address VARCHAR(255) NOT NULL,
    Store_description TEXT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL,
    image VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Orders (
    Order_id INT NOT NULL AUTO_INCREMENT,
    id INT NOT NULL,
    PRIMARY KEY (Order_id),
    FOREIGN KEY (id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS Order_Product (
    Order_id INT ,
    Store_ID INT ,
    Product_ID INT NOT NULL,
    Quantity INT NOT NULL,
    Status ENUM('reserved', 'picked_up', 'cancelled') NOT NULL DEFAULT 'reserved',
    PRIMARY KEY (Order_product_id),
    FOREIGN KEY (Order_id) REFERENCES Orders(Order_id),
    FOREIGN KEY (Store_ID) REFERENCES Store(Store_ID),
    FOREIGN KEY (Product_ID) REFERENCES Product(Product_ID)
);
