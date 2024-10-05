const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

(async () => {
  try {
    const db = await open({
      filename: ':memory:', // Use in-memory database
      driver: sqlite3.Database,
    });
    console.log('Connected to the SQLite in-memory database.');

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        cuisine TEXT,
        isVeg TEXT,
        rating REAL,
        priceForTwo INTEGER,
        location TEXT,
        hasOutdoorSeating TEXT,
        isLuxury TEXT
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS dishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        isVeg TEXT,
        rating REAL,
        price INTEGER
      );
    `);

    // Seed the database
    await seedDatabase(db);

  } catch (error) {
    console.error('Error opening database:', error.message);
  }
})();

// Function to seed the database
async function seedDatabase(db) {
  const restaurants = [
    {
      name: 'Spice Kitchen',
      cuisine: 'Indian',
      isVeg: 'true',
      rating: 4.5,
      priceForTwo: 1500,
      location: 'MG Road',
      hasOutdoorSeating: 'true',
      isLuxury: 'false',
    },
    {
      name: 'Olive Bistro',
      cuisine: 'Italian',
      isVeg: 'false',
      rating: 4.2,
      priceForTwo: 2000,
      location: 'Jubilee Hills',
      hasOutdoorSeating: 'false',
      isLuxury: 'true',
    },
    {
      name: 'Green Leaf',
      cuisine: 'Chinese',
      isVeg: 'true',
      rating: 4.0,
      priceForTwo: 1000,
      location: 'Banjara Hills',
      hasOutdoorSeating: 'false',
      isLuxury: 'false',
    },
  ];

  const dishes = [
    {
      name: 'Paneer Butter Masala',
      price: 300,
      rating: 4.5,
      isVeg: 'true',
    },
    {
      name: 'Chicken Alfredo Pasta',
      price: 500,
      rating: 4.7,
      isVeg: 'false',
    },
    {
      name: 'Veg Hakka Noodles',
      price: 250,
      rating: 4.3,
      isVeg: 'true',
    },
  ];

  const insertRestaurant = db.prepare(
    'INSERT INTO restaurants (name, cuisine, isVeg, rating, priceForTwo, location, hasOutdoorSeating, isLuxury) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertDish = db.prepare(
    'INSERT INTO dishes (name, isVeg, rating, price) VALUES (?, ?, ?, ?)'
  );

  for (let restaurant of restaurants) {
    await insertRestaurant.run(
      restaurant.name,
      restaurant.cuisine,
      restaurant.isVeg,
      restaurant.rating,
      restaurant.priceForTwo,
      restaurant.location,
      restaurant.hasOutdoorSeating,
      restaurant.isLuxury
    );
  }

  for (let dish of dishes) {
    await insertDish.run(dish.name, dish.isVeg, dish.rating, dish.price);
  }

  insertRestaurant.finalize();
  insertDish.finalize();

  console.log('Inserted initial data into the in-memory database.');
}
