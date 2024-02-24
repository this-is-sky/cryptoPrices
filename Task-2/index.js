const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// API endpoint for Task 2
app.post('/getPrice', async (req, res) => {
    try {
        const { fromCurrency, toCurrency, date } = req.body;

        // Validate input parameters
        if (!fromCurrency || !toCurrency || !date) {
            return res.status(400).json({ error: 'Invalid input parameters' });
        }

        // Fetch historical price data
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${fromCurrency}/history`, {
            params: {
                date: date,
                localization: false
            }
        });

        // Check if the response contains valid data
        if (!response.data.market_data || !response.data.market_data.current_price || !response.data.market_data.current_price[toCurrency]) {
            return res.status(404).json({ error: 'Price data not found for the given currencies and date' });
        }

        const priceInToCurrency = response.data.market_data.current_price[toCurrency];
        res.json({ price: priceInToCurrency });
    } catch (error) {
        console.error('Error fetching price:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
