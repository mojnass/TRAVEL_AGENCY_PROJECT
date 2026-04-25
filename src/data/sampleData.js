// Sample data for hotels, restaurants, attractions, and spa services
export const sampleHotels = [
  {
    name: "Grand Plaza Hotel",
    city: "New York",
    country: "USA",
    price_per_night: 250,
    rating: 4.5,
    amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant"],
    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500"
  },
  {
    name: "Seaside Resort & Spa",
    city: "Los Angeles",
    country: "USA",
    price_per_night: 180,
    rating: 4.2,
    amenities: ["WiFi", "Pool", "Beach Access", "Spa"],
    image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500"
  },
  {
    name: "Mountain View Lodge",
    city: "Denver",
    country: "USA",
    price_per_night: 120,
    rating: 4.0,
    amenities: ["WiFi", "Restaurant", "Parking"],
    image_url: "https://images.unsplash.com/photo-1571003123894-1f05e4d68d0a?w=500"
  },
  {
    name: "Royal Palace Hotel",
    city: "London",
    country: "UK",
    price_per_night: 350,
    rating: 4.8,
    amenities: ["WiFi", "Pool", "Gym", "Concierge", "Bar"],
    image_url: "https://images.unsplash.com/photo-1564501049417-61e40cd921ce?w=500"
  },
  {
    name: "Tokyo Tower Inn",
    city: "Tokyo",
    country: "Japan",
    price_per_night: 200,
    rating: 4.3,
    amenities: ["WiFi", "Restaurant", "Onsen"],
    image_url: "https://images.unsplash.com/photo-1551882547-ff40c63e5270?w=500"
  }
];

export const sampleRestaurants = [
  {
    name: "The Golden Fork",
    city: "New York",
    country: "USA",
    cuisine: "American",
    price_range: "$$",
    rating: 4.4,
    specialties: ["Steak", "Seafood", "Wine"],
    image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500"
  },
  {
    name: "Pasta Paradise",
    city: "Los Angeles",
    country: "USA",
    cuisine: "Italian",
    price_range: "$$",
    rating: 4.6,
    specialties: ["Pasta", "Pizza", "Tiramisu"],
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500"
  },
  {
    name: "Sushi Master",
    city: "Tokyo",
    country: "Japan",
    cuisine: "Japanese",
    price_range: "$$$",
    rating: 4.8,
    specialties: ["Sushi", "Sashimi", "Ramen"],
    image_url: "https://images.unsplash.com/photo-1579584426539-510436d3abf4?w=500"
  },
  {
    name: "Le Bistro Parisien",
    city: "Paris",
    country: "France",
    cuisine: "French",
    price_range: "$$$",
    rating: 4.7,
    specialties: ["Escargot", "Coq au Vin", "Crème Brûlée"],
    image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500"
  },
  {
    name: "Curry House",
    city: "London",
    country: "UK",
    cuisine: "Indian",
    price_range: "$$",
    rating: 4.3,
    specialties: ["Chicken Tikka", "Naan", "Samosas"],
    image_url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500"
  }
];

export const sampleAttractions = [
  {
    name: "Central Park",
    city: "New York",
    country: "USA",
    category: "Park",
    ticket_price: 0,
    rating: 4.7,
    description: "Large public park in the heart of Manhattan",
    image_url: "https://images.unsplash.com/photo-1563471065-93f1932ad6a8?w=500"
  },
  {
    name: "Hollywood Sign",
    city: "Los Angeles",
    country: "USA",
    category: "Landmark",
    ticket_price: 0,
    rating: 4.5,
    description: "Iconic landmark on Mount Lee in Hollywood",
    image_url: "https://images.unsplash.com/photo-1515870966519-378e7135018a?w=500"
  },
  {
    name: "Eiffel Tower",
    city: "Paris",
    country: "France",
    category: "Landmark",
    ticket_price: 25,
    rating: 4.6,
    description: "Iconic iron lattice tower on the Champ de Mars",
    image_url: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=500"
  },
  {
    name: "Tokyo Tower",
    city: "Tokyo",
    country: "Japan",
    category: "Landmark",
    ticket_price: 20,
    rating: 4.4,
    description: "Communications and observation tower inspired by the Eiffel Tower",
    image_url: "https://images.unsplash.com/photo-1551882547-ff40c63e5270?w=500"
  },
  {
    name: "British Museum",
    city: "London",
    country: "UK",
    category: "Museum",
    ticket_price: 0,
    rating: 4.8,
    description: "World-famous museum of art and culture",
    image_url: "https://images.unsplash.com/photo-1572006472450-32c6509c7491?w=500"
  }
];

export const sampleSpaServices = [
  {
    name: "Tranquil Waters Spa",
    city: "New York",
    country: "USA",
    services: ["Massage", "Facial", "Body Wrap", "Sauna"],
    price_range: "$$$",
    rating: 4.6,
    description: "Luxury spa in the heart of Manhattan",
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500"
  },
  {
    name: "Sunset Wellness Center",
    city: "Los Angeles",
    country: "USA",
    services: ["Massage", "Yoga", "Meditation", "Aromatherapy"],
    price_range: "$$",
    rating: 4.4,
    description: "Holistic wellness center with ocean views",
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"
  },
  {
    name: "Zen Garden Spa",
    city: "Tokyo",
    country: "Japan",
    services: ["Massage", "Onsen", "Acupuncture", "Tea Ceremony"],
    price_range: "$$$",
    rating: 4.8,
    description: "Traditional Japanese spa experience",
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500"
  },
  {
    name: "Parisian Beauty Retreat",
    city: "Paris",
    country: "France",
    services: ["Facial", "Massage", "Body Treatment", "Manicure"],
    price_range: "$$$",
    rating: 4.7,
    description: "Elegant beauty spa in the heart of Paris",
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"
  },
  {
    name: "Royal Thai Spa",
    city: "London",
    country: "UK",
    services: ["Thai Massage", "Herbal Compress", "Foot Massage", "Steam Room"],
    price_range: "$$",
    rating: 4.5,
    description: "Authentic Thai spa experience in London",
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500"
  }
];

// Function to insert sample data into Supabase
export const insertSampleData = async (supabase) => {
  try {
    console.log('🌱 Inserting sample data...');
    
    // Insert hotels
    for (const hotel of sampleHotels) {
      const { error } = await supabase
        .from('hotels')
        .insert([hotel]);
      if (error) console.error('Error inserting hotel:', error);
    }
    
    // Insert restaurants
    for (const restaurant of sampleRestaurants) {
      const { error } = await supabase
        .from('restaurants')
        .insert([restaurant]);
      if (error) console.error('Error inserting restaurant:', error);
    }
    
    // Insert attractions
    for (const attraction of sampleAttractions) {
      const { error } = await supabase
        .from('attractions')
        .insert([attraction]);
      if (error) console.error('Error inserting attraction:', error);
    }
    
    // Insert spa services
    for (const spa of sampleSpaServices) {
      const { error } = await supabase
        .from('spa_venues')
        .insert([spa]);
      if (error) console.error('Error inserting spa:', error);
    }
    
    console.log('✅ Sample data inserted successfully!');
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  }
};
