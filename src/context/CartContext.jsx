import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addToCart = (item, type) => {
    const cartItem = {
      id: `${type}_${item.hotel_id || item.offer_id || item.restaurant_id || item.attraction_id}`,
      type: type.slice(0, -1), // Remove 's' from plural
      name: item.name || `${item.airline_code} ${item.flight_number}`,
      price: item.price_per_night || item.price || 0,
      image: item.thumbnail_url || '',
      details: item,
      quantity: 1,
      addedAt: new Date().toISOString()
    };

    setCartItems(prev => {
      const existing = prev.find(existingItem => existingItem.id === cartItem.id);
      if (existing) {
        return prev.map(item => 
          item.id === cartItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, cartItem];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
      isLoading,
      setIsLoading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
