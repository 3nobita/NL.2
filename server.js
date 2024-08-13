const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const Developer = require('./models/Developer'); 
const Property = require('./models/Property'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key', // Change this to a more secure secret
  resave: false,
  saveUninitialized: true,
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Admin access middleware
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'views', 'verify-code.html'));
};

// Route to display properties
app.get('/', async (req, res) => {
  try {
    const selectedCategories = req.query.categories ? req.query.categories.split(',') : [];
    let propertyFilter = {};
    let developerFilter = {};

    if (selectedCategories.length > 0) {
      propertyFilter.categories = { $in: selectedCategories };
      developerFilter.categories = { $in: selectedCategories };
    }

    const allProperties = await Property.find(propertyFilter);
    const allDevelopers = await Developer.find(developerFilter);

    const categorizedProperties = {
      hero: allProperties.filter(p => p.categories.includes('Hero')),
      spotlight: allProperties.filter(p => p.categories.includes('Spotlight')),
      luxuryRedefined: allProperties.filter(p => p.categories.includes('Luxury Redefined')),
      accessibleProject: allProperties.filter(p => p.categories.includes('Accessible Project')),
      trendingResidences: allProperties.filter(p => p.categories.includes('Trending Residences')),
      signatureDevelopments: allProperties.filter(p => p.categories.includes('SIGNATURE Developments')),
      residentialProjects: allProperties.filter(p => p.categories.includes('Residential Projects')),
      commercialProjects: allProperties.filter(p => p.categories.includes('Commercial Projects')),
    };

    const categorizedDevelopers = {
      residential: allDevelopers.filter(d => d.categories.includes('Residential Projects')),
      commercial: allDevelopers.filter(d => d.categories.includes('Commercial Projects')),
    };

    res.render('index', { 
      properties: categorizedProperties,
      developers: categorizedDevelopers,
      isAdmin: req.session.isAdmin
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});



// Route to display add property form (restricted to admin)
app.get('/add', isAdmin, (req, res) => {
  res.render('add');
});

app.get('/addDev', (req, res) => {
  res.render('addDeveloper', { developer: {} }); // Pass an empty object or provide default values
});

// Handle adding new property
app.post('/add', isAdmin, async (req, res) => {
  try {
    const {
      name,
      by,
      location,
      price,
      status,
      configuration,
      possession,
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      highlight,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual,
      categories, // Should be an array of strings
      imageUrl
    } = req.body;

    const newProperty = new Property({
      name,
      by,
      location,
      price,
      status,
      configuration,
      possession: possession ? new Date(possession) : undefined, // Convert to Date if present
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      highlight,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual,
      categories: categories ? categories.split(',') : [], // Convert comma-separated string to array
      imageUrl
    });

    await newProperty.save();
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Handle adding new developer
app.post('/addDev', isAdmin, async (req, res) => {
  try {
    const {
      logo,
      name,
      established,
      project,
      shortDescription,
      longDescription,
      ongoingProjects,
      cityPresent,
      categories, // Should be an array of strings
      imageUrl,
      by,
      location,
      price,
      status,
      configuration,
      possession,
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      highlight,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual
    } = req.body;

    const newDeveloper = new Developer({
      logo,
      name,
      established,
      project,
      shortDescription,
      longDescription,
      ongoingProjects,
      cityPresent,
      categories: categories ? categories.split(',') : [], // Convert comma-separated string to array
      imageUrl,
      by,
      location,
      price,
      status,
      configuration,
      possession: possession ? new Date(possession) : undefined, // Convert to Date if present
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      highlight,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual
    });

    await newDeveloper.save();
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Admin code verification route
app.post('/verify-code', (req, res) => {
  const { code } = req.body;
  const accessCode = '9671'; // Code to access the admin dashboard

  if (code === accessCode) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.status(401).send('Unauthorized');
  }
});


// Admin dashboard
app.get('/admin', isAdmin, async (req, res) => {
  try {
    const properties = await Property.find();
    const developers = await Developer.find();
    res.render('admin-dashboard', { properties, developers });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// Route to display edit property form (restricted to admin)
app.get('/admin/edit/property/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).send('Property not found');
    }
    res.render('editProperty', { property });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// Route to display edit developer form (restricted to admin)
app.get('/admin/edit/developer/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const developer = await Developer.findById(id);
    if (!developer) {
      return res.status(404).send('Developer not found');
    }
    res.render('editDeveloper', { developer });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Handle updating a property
app.post('/admin/update/property/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      by,
      location,
      price,
      status,
      configuration,
      possession,
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      highlight,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual,
      categories, // Should be an array of strings
      imageUrl
    } = req.body;

    const updatedProperty = await Property.findByIdAndUpdate(id, {
      name,
      by,
      location,
      price,
      status,
      configuration,
      possession: possession ? new Date(possession) : undefined, // Convert to Date if present
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      highlight,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual,
      categories: categories ? categories.split(',') : [], // Convert comma-separated string to array
      imageUrl
    }, { new: true });

    if (!updatedProperty) {
      return res.status(404).send('Property not found');
    }
    res.redirect('/admin');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Handle updating a developer
app.post('/admin/update/developer/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      logo,
      name,
      established,
      project,
      shortDescription,
      longDescription,
      ongoingProjects,
      cityPresent,
      categories, // Should be an array of strings
      imageUrl,
      by,
      location,
      price,
      status,
      configuration,
      possession,
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      highlight,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual
    } = req.body;

    const updatedDeveloper = await Developer.findByIdAndUpdate(id, {
      logo,
      name,
      established,
      project,
      shortDescription,
      longDescription,
      ongoingProjects,
      cityPresent,
      categories: categories ? categories.split(',') : [], // Convert comma-separated string to array
      imageUrl,
      by,
      location,
      price,
      status,
      configuration,
      possession: possession ? new Date(possession) : undefined, // Convert to Date if present
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      highlight,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual
    }, { new: true });

    if (!updatedDeveloper) {
      return res.status(404).send('Developer not found');
    }
    res.redirect('/admin');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Handle deletion of a property or developer
app.post('/admin/delete/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Perform deletion for both Property and Developer models
    const propertyDeletion = Property.findByIdAndDelete(id);
    const developerDeletion = Developer.findByIdAndDelete(id);

    // Wait for both deletion operations to complete
    await Promise.all([propertyDeletion, developerDeletion]);

    res.redirect('/admin');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
