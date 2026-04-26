const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

// Check if Duffel token is configured (support both naming conventions)
const DUFFEL_TOKEN = process.env.DUFFEL_ACCESS_TOKEN || process.env.VITE_DUFFEL_ACCESS_TOKEN;

const app = express();

// Enable CORS for frontend
app.use(cors());

// Parse JSON body
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    duffelConfigured: !!DUFFEL_TOKEN,
    tokenPreview: DUFFEL_TOKEN ? DUFFEL_TOKEN.substring(0, 10) + '...' : null
  });
});
if (!DUFFEL_TOKEN) {
  console.error('\n❌ ERROR: Duffel access token is not set!');
  console.error('Please create a .env file with one of:');
  console.error('  DUFFEL_ACCESS_TOKEN=your_duffel_token_here');
  console.error('  OR');
  console.error('  VITE_DUFFEL_ACCESS_TOKEN=your_duffel_token_here');
  console.error('Get your token from: https://duffel.com/dashboard/access-tokens\n');
} else {
  console.log('✅ Duffel token found');
}

// Manual Duffel API proxy for offer requests
app.post('/duffel/air/offer_requests', async (req, res) => {
  console.log('📥 Received request to /duffel/air/offer_requests');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  if (!DUFFEL_TOKEN) {
    console.error('❌ No DUFFEL_TOKEN configured!');
    return res.status(500).json({ 
      error: 'Duffel API not configured',
      message: 'Please set DUFFEL_ACCESS_TOKEN in .env file'
    });
  }

  console.log('✅ Token found, forwarding to Duffel API...');

  try {
    const response = await fetch('https://api.duffel.com/air/offer_requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DUFFEL_TOKEN}`,
        'Duffel-Version': 'v2',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    console.log(`📡 Duffel API responded with status: ${response.status}`);
    
    const responseText = await response.text();
    console.log('📄 Duffel response body:', responseText.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse Duffel response as JSON:', e.message);
      return res.status(500).json({ 
        error: 'Invalid response from Duffel API',
        message: 'Response was not valid JSON'
      });
    }
    
    if (!response.ok) {
      console.error('❌ Duffel API error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to connect to Duffel API',
      message: error.message,
      stack: error.stack
    });
  }
});

// Get offers from Duffel
app.get('/duffel/air/offers', async (req, res) => {
  if (!DUFFEL_TOKEN) {
    return res.status(500).json({ error: 'Duffel API not configured' });
  }

  const offerRequestId = req.query.offer_request_id;
  if (!offerRequestId) {
    return res.status(400).json({ error: 'offer_request_id required' });
  }

  try {
    const response = await fetch(`https://api.duffel.com/air/offers?offer_request_id=${offerRequestId}`, {
      headers: {
        'Authorization': `Bearer ${DUFFEL_TOKEN}`,
        'Duffel-Version': 'v2',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Duffel proxy server running on http://localhost:${PORT}`);
  console.log('Make sure to set DUFFEL_ACCESS_TOKEN in .env file');
  console.log('Test: curl http://localhost:' + PORT + '/health');
});
