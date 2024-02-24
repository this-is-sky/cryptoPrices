const axios = require('axios');
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb+srv://admin:Sky%401234@cluster0.yzp077u.mongodb.net/cryptoDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Define the schema
const cryptoSchema = new mongoose.Schema({
    name: String,
    id: String
});

const Crypto = mongoose.model('Crypto', cryptoSchema);

// Function to fetch and store crypto data
const fetchAndStoreCryptoData = async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/list');
        const cryptos = response.data;

        // Clear existing data in the collection
        await Crypto.deleteMany();

        // Save new crypto data to MongoDB
        await Crypto.insertMany(cryptos);

        console.log('Crypto data updated successfully.');
    } catch (error) {
        console.error('Error updating crypto data:', error.message);
    }
};

// Run the function initially
fetchAndStoreCryptoData();

// Schedule the job to run every 1 hour
setInterval(fetchAndStoreCryptoData, 3600000); // 1 hour in milliseconds
