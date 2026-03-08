-- Add Products for Fashion Paradise
INSERT INTO products (business_id, name, description, price, quantity_in_stock, category, primary_image_url, is_active)
SELECT id, 'Red Summer Dress', 'Elegant flowy dress perfect for summer', 15000, 25, 'Dresses', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Fashion Paradise'
UNION ALL
SELECT id, 'Denim Jacket', 'Classic blue denim jacket', 12000, 15, 'Jackets', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Fashion Paradise'
UNION ALL
SELECT id, 'Black Leather Handbag', 'Premium quality leather handbag', 25000, 10, 'Accessories', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Fashion Paradise'
UNION ALL
SELECT id, 'White Sneakers', 'Comfortable casual sneakers', 18000, 30, 'Shoes', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Fashion Paradise'
UNION ALL
SELECT id, 'Floral Scarf', 'Silk floral print scarf', 5000, 50, 'Accessories', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Fashion Paradise';

-- Add Products for Tech Hub Electronics
INSERT INTO products (business_id, name, description, price, quantity_in_stock, category, primary_image_url, is_active)
SELECT id, 'iPhone 15 Pro', 'Latest iPhone with A17 Pro chip', 850000, 12, 'Smartphones', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Tech Hub Electronics'
UNION ALL
SELECT id, 'MacBook Air M3', '13-inch laptop with M3 chip', 1200000, 8, 'Laptops', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Tech Hub Electronics'
UNION ALL
SELECT id, 'AirPods Pro', 'Wireless earbuds with ANC', 150000, 20, 'Audio', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Tech Hub Electronics'
UNION ALL
SELECT id, 'Samsung Galaxy Watch', 'Smartwatch with health tracking', 120000, 15, 'Wearables', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Tech Hub Electronics'
UNION ALL
SELECT id, 'Portable Charger', '20000mAh power bank', 15000, 40, 'Accessories', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Tech Hub Electronics';

-- Add Products for Delicious Bites
INSERT INTO products (business_id, name, description, price, quantity_in_stock, category, primary_image_url, is_active)
SELECT id, 'Jollof Rice Special', 'Party jollof with chicken', 3500, 100, 'Main Dishes', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Delicious Bites'
UNION ALL
SELECT id, 'Suya Platter', 'Spicy grilled beef skewers', 4000, 80, 'Grills', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Delicious Bites'
UNION ALL
SELECT id, 'Pounded Yam & Egusi', 'Traditional Nigerian soup', 4500, 60, 'Traditional', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Delicious Bites'
UNION ALL
SELECT id, 'Chicken Wings', 'Crispy fried wings (12 pcs)', 3000, 90, 'Appetizers', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Delicious Bites'
UNION ALL
SELECT id, 'Fresh Chapman', 'Nigerian cocktail drink', 1500, 150, 'Drinks', 'https://via.placeholder.com/200', true
FROM businesses WHERE business_name = 'Delicious Bites';

-- Display summary
SELECT 'Businesses' as entity, COUNT(*) as count FROM businesses
UNION ALL
SELECT 'Products', COUNT(*) FROM products;
