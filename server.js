// server.js

require('dotenv').config(); // MUST be the first line
const express = require('express');
const cors = require('cors'); // Required for frontend communication
const connectDB = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// --- Initialization ---
const app = express(); // CRITICAL: Defines 'app' before use

// --- Route Imports ---
const authRoutes = require('./routes/authRoutes'); 
const storeRoutes = require('./routes/storeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes'); // Import products here
// const adminRoutes = require('./routes/adminRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <-- NEW IMPORT

// Connect to Database
connectDB(); 

// --- Middleware Setup ---
app.use(express.json()); // Body parser for JSON
app.use(cors()); // Allow frontend communication

app.use(helmet()); 
app.get('/', (req, res) => {
    res.send('E-commerce API is running...');
});


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
// --- API Routes (v1) ---
app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/products', productRoutes); 
app.use('/api/v1/admin', adminRoutes);// Use
// app.use('/api/v1/admin', adminRoutes); / productRoutes here

// --- Error Handlers ---
app.use(notFound);
app.use(limiter);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});