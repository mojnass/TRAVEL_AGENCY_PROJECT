const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Check if Duffel token is configured
const DUFFEL_TOKEN = process.env.DUFFEL_ACCESS_TOKEN || process.env.VITE_DUFFEL_ACCESS_TOKEN;

if (!DUFFEL_TOKEN) {
  console.error('\n❌ ERROR: Duffel access token is not set!');
  console.error('Please create a .env file with:');
  console.error('  VITE_DUFFEL_ACCESS_TOKEN=your_duffel_token_here');
  console.error('Get your token from: https://duffel.com/dashboard/access-tokens\n');
} else {
  console.log('✅ Duffel token found');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    duffelConfigured: !!DUFFEL_TOKEN,
    tokenPreview: DUFFEL_TOKEN ? DUFFEL_TOKEN.substring(0, 10) + '...' : null
  });
});

// Duffel API proxy
app.use('/duffel', async (req, res) => {
  if (!DUFFEL_TOKEN) {
    return res.status(500).json({ 
      error: 'Duffel API not configured',
      message: 'Please set VITE_DUFFEL_ACCESS_TOKEN in .env file'
    });
  }

  // Build the full URL for Duffel API
  const duffelUrl = `https://api.duffel.com${req.path}`;
  console.log(`📡 Forwarding ${req.method} ${req.path} to ${duffelUrl}`);

  try {
    const response = await fetch(duffelUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${DUFFEL_TOKEN}`,
        'Duffel-Version': 'v2',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const responseText = await response.text();
    console.log(`📡 Duffel response: ${response.status}`);

    if (!response.ok) {
      console.error('❌ Duffel error:', responseText);
      return res.status(response.status).send(responseText);
    }

    res.status(response.status).send(responseText);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({ 
      error: 'Failed to connect to Duffel API',
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Duffel proxy server running on http://localhost:${PORT}`);
  console.log('Test: curl http://localhost:' + PORT + '/health');
});
