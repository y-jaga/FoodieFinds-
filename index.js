const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

let db;

// Initialize the database in memory
(async () => {
  try {
    db = await open({
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
    await seedDatabase();

  } catch (error) {
    console.error('Error opening database:', error.message);
  }
})();

// Function to seed the database
async function seedDatabase() {
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

// Exercise 1: Get All Restaurants
// API Call: http://localhost:3000/restaurants
async function fetchAllRestaurants() {
  let query = 'SELECT * FROM restaurants';
  let response = await db.all(query, []);

  return { restaurants: response };
}

app.get('/restaurants', async (req, res) => {
  try {
    let results = await fetchAllRestaurants();

    if (results.restaurants.length === 0) {
      return res.status(404).json({ message: 'No restaurants found.' });
    }

    res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Exercise 2: Get Restaurant by ID
// API Call: http://localhost:3000/restaurants/details/1
async function fetchRestaurantsById(id) {
  let query = 'SELECT * FROM restaurants WHERE id = ?';
  let response = await db.all(query, [id]);

  return { restaurants: response };
}

app.get('/restaurants/details/:id', async (req, res) => {
  let id = parseInt(req.params.id);

  try {
    let results = await fetchRestaurantsById(id);

    if (results.restaurants.length === 0) {
      return res
        .status(404)
        .json({ message: 'No restaurants found for id ' + id });
    }

    res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Exercise 3: Get Restaurants by Cuisine
// API Call: http://localhost:3000/restaurants/cuisine/Indian
async function fetchRestaurantsByCuisine(cuisine) {
  let query = 'SELECT * FROM restaurants WHERE cuisine = ?';
  let response = await db.all(query, [cuisine]);

  return { restaurants: response };
}

app.get('/restaurants/cuisine/:cuisine', async (req, res) => {
  const cuisine = req.params.cuisine;

  try {
    let results = await fetchRestaurantsByCuisine(cuisine);

    if (results.restaurants.length === 0) {
      return res
        .status(404)
        .json({ message: 'No restaurants found for cuisine ' + cuisine });
    }

    res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Exercise 4: Get Restaurants by Filter
// API Call: http://localhost:3000/restaurants/filter?isVeg=true&hasOutdoorSeating=true&isLuxury=false
async function fetchRestaurantsByFilters(isVeg, hasOutdoorSeating, isLuxury) {
  let query =
    'SELECT * FROM restaurants WHERE isVeg = ? AND hasOutdoorSeating = ? AND isLuxury = ?';
  let response = await db.all(query, [isVeg, hasOutdoorSeating, isLuxury]);

  return { restaurants: response };
}

app.get('/restaurants/filter', async (req, res) => {
  const isVeg = req.query.isVeg;
  const hasOutdoorSeating = req.query.hasOutdoorSeating;
  const isLuxury = req.query.isLuxury;

  try {
    let results = await fetchRestaurantsByFilters(
      isVeg,
      hasOutdoorSeating,
      isLuxury
    );

    if (results.restaurants.length === 0) {
      return res
        .status(404)
        .json({ message: 'No restaurants found for given filters.' });
    }

    res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Exercise 5: Get Restaurants Sorted by Rating
// API Call: http://localhost:3000/restaurants/sort-by-rating
async function sortRestaurantsByRating() {
  let query = 'SELECT * FROM restaurants ORDER BY rating DESC';
  let response = await db.all(query, []);

  return { restaurants: response };
}

app.get('/restaurants/sort-by-rating', async (req, res) => {
  try {
    let results = await sortRestaurantsByRating();

    if (results.restaurants.length === 0) {
      return res.status(404).json({ message: 'No restaurants found.' });
    }

    res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Exercise 6: Get All Dishes
// API Call: http://localhost:3000/dishes
async function fetchAllDishes() {
  let query = 'SELECT * FROM dishes';
  let response = await db.all(query, []);

  return { dishes: response };
}

app.get('/dishes', async (req, res) => {
  try {
    let results = await fetchAllDishes();

    if (results.dishes.length === 0) {
      return res.status(404).json({ message: 'No dishes found.' });
    }

    res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Exercise 7: Get Dish by ID
// API Call: http://localhost:3000/dishes/details/1
async function fetchDishesById(id) {
  let query = 'SELECT * FROM dishes WHERE id = ?';
  let response = await db.all(query, [id]);

  return { dishes: response };
}

app.get('/dishes/details/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    let results = await fetchDishesById(id);

    if (results.dishes.length === 0) {
      return res.status(404).json({ message: 'No dishes found for id ' + id });
    }

    res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Exercise 8: Get Dishes by Filter
// API Call: http://localhost:3000/dishes/filter?isVeg=true
async function fetchDishesByFilter(isVeg) {
  let query = 'SELECT * FROM dishes WHERE isVeg = ?';
  let response = await db.all(query, [isVeg]);

  return { dishes: response };
}

app.get('/dishes/filter', async (req, res) => {
  const isVeg = req.query.isVeg;

  try {
    let results = await fetchDishesByFilter(isVeg);

    if (results.dishes.length === 0) {
      return res.status(404).json({ message: 'No dishes found for given filter.' });
    }

    res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Exercise 9: Get Dishes Sorted by Rating
// API Call: http://localhost:3000/dishes/sort-by-rating
async function sortDishesByRating() {
  let query = 'SELECT * FROM dishes ORDER BY rating DESC';
  let response = await db.all(query, []);

  return { dishes: response };
}

app.get('/dishes/sort-by-rating', async (req, res) => {
  try {
    let results = await sortDishesByRating();

    if (results.dishes.length === 0) {
      return res.status(404).json({ message: 'No dishes found.' });
    }

    res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('Server is running at https://localhost:' + PORT);
});
