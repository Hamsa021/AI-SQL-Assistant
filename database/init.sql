-- AI SQL Assistant - Sample Database Schema
-- A realistic e-commerce/business database for demo purposes

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    department VARCHAR(80),
    hire_date DATE,
    salary NUMERIC(10, 2)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    employee_id INTEGER REFERENCES employees(id),
    order_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'pending',
    total_amount NUMERIC(12, 2) DEFAULT 0
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL
);

-- ────────────────────────────────────────
-- Seed data
-- ────────────────────────────────────────

INSERT INTO categories (name, description) VALUES
('Electronics', 'Gadgets and devices'),
('Clothing', 'Apparel and accessories'),
('Books', 'Physical and digital books'),
('Home & Garden', 'Home improvement and garden supplies'),
('Sports', 'Sports equipment and gear')
ON CONFLICT DO NOTHING;

INSERT INTO customers (name, email, city, country) VALUES
('Alice Johnson', 'alice@example.com', 'New York', 'USA'),
('Bob Smith', 'bob@example.com', 'London', 'UK'),
('Carol White', 'carol@example.com', 'Toronto', 'Canada'),
('David Lee', 'david@example.com', 'Sydney', 'Australia'),
('Emma Brown', 'emma@example.com', 'Berlin', 'Germany'),
('Frank Garcia', 'frank@example.com', 'Madrid', 'Spain'),
('Grace Kim', 'grace@example.com', 'Seoul', 'South Korea'),
('Henry Wilson', 'henry@example.com', 'Chicago', 'USA'),
('Iris Chen', 'iris@example.com', 'Shanghai', 'China'),
('Jack Taylor', 'jack@example.com', 'Paris', 'France')
ON CONFLICT DO NOTHING;

INSERT INTO employees (first_name, last_name, department, hire_date, salary) VALUES
('Sarah', 'Connor', 'Sales', '2019-03-15', 72000),
('Mike', 'Davis', 'Sales', '2020-07-01', 68000),
('Lisa', 'Park', 'Engineering', '2018-11-20', 95000),
('Tom', 'Evans', 'Marketing', '2021-01-10', 65000),
('Nancy', 'Martinez', 'Support', '2022-05-05', 55000)
ON CONFLICT DO NOTHING;

INSERT INTO products (name, category_id, price, stock_quantity, reorder_level) VALUES
('Wireless Headphones', 1, 129.99, 150, 20),
('Mechanical Keyboard', 1, 89.99, 80, 15),
('4K Monitor', 1, 349.99, 40, 5),
('Running Shoes', 5, 74.99, 200, 30),
('Yoga Mat', 5, 29.99, 300, 50),
('Python Programming Book', 3, 44.99, 120, 20),
('Design Patterns Book', 3, 39.99, 90, 15),
('Cotton T-Shirt', 2, 19.99, 500, 100),
('Winter Jacket', 2, 149.99, 60, 10),
('Indoor Plant Kit', 4, 34.99, 180, 25)
ON CONFLICT DO NOTHING;

-- Generate 200 orders over the past year
INSERT INTO orders (customer_id, employee_id, order_date, status, total_amount)
SELECT
    (random() * 9 + 1)::int,
    (random() * 4 + 1)::int,
    NOW() - (random() * INTERVAL '365 days'),
    (ARRAY['pending','processing','shipped','delivered','cancelled'])[floor(random()*5+1)],
    0
FROM generate_series(1, 200);

-- Generate order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT
    o.id,
    (random() * 9 + 1)::int,
    (random() * 4 + 1)::int,
    p.price
FROM orders o
JOIN LATERAL (
    SELECT id, price FROM products ORDER BY random() LIMIT 1
) p ON true;

-- Update order totals
UPDATE orders o
SET total_amount = (
    SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = o.id
);
