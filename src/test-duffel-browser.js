// Test Duffel environment variables in browser
console.log('🔍 Testing Duffel Environment Variables');

const duffelToken = import.meta.env.VITE_DUFFEL_ACCESS_TOKEN;

if (duffelToken) {
  console.log('✅ Duffel token found:', duffelToken.substring(0, 20) + '...');
  console.log('🔑 Token length:', duffelToken.length);
  console.log('✅ Duffel integration should work');
} else {
  console.log('❌ Duffel token not found');
  console.log('💡 Add to .env: VITE_DUFFEL_ACCESS_TOKEN=your_duffel_token');
  console.log('📋 Check if .env file exists and has the correct token');
}

// Test the API call structure
console.log('🧪 Testing API call structure...');

const testApiCall = async () => {
  const token = import.meta.env.VITE_DUFFEL_ACCESS_TOKEN;
  
  if (!token) {
    console.log('❌ Cannot test API - no token');
    return;
  }

  const body = {
    data: {
      slices: [
        {
          origin: 'NYC',
          destination: 'LAX',
          departure_date: '2026-06-15',
        },
      ],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy',
    },
  };

  try {
    console.log('🌐 Making API call to /duffel/air/offer_requests...');
    const response = await fetch('/duffel/air/offer_requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Duffel-Version': 'v1',
      },
      body: JSON.stringify(body),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      return;
    }

    const result = await response.json();
    console.log('✅ API Success! Raw response:', result);
    
    if (result.data && result.data.offers) {
      console.log('✈️ Found', result.data.offers.length, 'flight offers');
      console.log('📋 First offer:', result.data.offers[0]);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
};

// Run the test
testApiCall();
