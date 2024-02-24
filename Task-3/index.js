const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://admin:Sky%401234@cluster0.yzp077u.mongodb.net/cryptoDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Define the updated schema
const cryptoSchema = new mongoose.Schema({
    name: String,
    id: String,
    publicTreasury: {
        type: [
            {
                company: String,
                holding: Number,
                percentage_of_supply: Number
            }
        ],
        default: []
    }
});

const Crypto = mongoose.model('Crypto', cryptoSchema);

// Function to fetch and store crypto data with public treasury information
const fetchAndStoreCryptoData = async () => {
    try {
        // Fetch basic crypto data
        const cryptoListResponse = await axios.get('https://api.coingecko.com/api/v3/coins/list');
        const cryptos = cryptoListResponse.data;

        // Fetch public treasury data for each crypto
        for (const crypto of cryptos) {
            await fetchWithExponentialBackoff(crypto);
        }

        console.log('Crypto data with public treasury information updated successfully.');
    } catch (error) {
        console.error('Error updating crypto data:', error.message);
    }
};

// Run the function initially
fetchAndStoreCryptoData();

// Schedule the job to run every 1 hour
setInterval(fetchAndStoreCryptoData, 3600000); // 1 hour in milliseconds

// Function to fetch with exponential backoff
const fetchWithExponentialBackoff = async (crypto, retryAttempt = 0) => {
    try {
        const treasuryResponse = await axios.get(`https://api.coingecko.com/api/v3/companies/public_treasury`, {
            params: {
                currency: crypto.id
            }
        });

        // Update or insert data into MongoDB
        await Crypto.findOneAndUpdate(
            { id: crypto.id },
            {
                name: crypto.name,
                id: crypto.id,
                publicTreasury: treasuryResponse.data
            },
            { upsert: true }
        );
    } catch (treasuryError) {
        console.error(`Error fetching public treasury data for ${crypto.name} (${crypto.id}):`, treasuryError.message);

        if (retryAttempt < 3) {
            const delay = Math.pow(2, retryAttempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            await fetchWithExponentialBackoff(crypto, retryAttempt + 1);
        }
    }
};

// API endpoint for Task 3
app.get('/getPublicTreasury', async (req, res) => {
    try {
        const { currency } = req.query;

        // Validate input parameter
        if (!currency) {
            return res.status(400).json({ error: 'Invalid input parameters' });
        }

        const cryptoData = await Crypto.findOne({ id: currency });
        if (!cryptoData) {
            return res.status(404).json({ error: 'Crypto not found' });
        }

        const publicTreasuryInfo = cryptoData.publicTreasury;
        res.json({ currency, publicTreasury: publicTreasuryInfo });
    } catch (error) {
        console.error('Error fetching public treasury information:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
