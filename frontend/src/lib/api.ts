// API configuration - centralized API URL management
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  studentRegister: `${API_URL}/api/student/register`,
  studentLogin: `${API_URL}/api/student/login`,
  shopRegister: `${API_URL}/api/shop/register`,
  shopLogin: `${API_URL}/api/shop/login`,
  superadminLogin: `${API_URL}/api/superadmin/login`,
  
  // Shop
  shopInfo: (shopId: string) => `${API_URL}/api/shop/${shopId}`,
  shopUpdatePricing: (shopId: string) => `${API_URL}/api/shop/${shopId}/pricing`,
  activePricing: `${API_URL}/api/pricing`,
  
  // Wallet
  wallet: (userId: string) => `${API_URL}/api/wallet/${userId}`,
  
  // Orders
  createOrder: `${API_URL}/api/orders/create`,
  shopViewOrders: `${API_URL}/api/orders/shop-view`,
  orderStatus: (orderId: string) => `${API_URL}/api/orders/${orderId}/status`,
  orderDetails: (orderId: string) => `${API_URL}/api/orders/${orderId}`,
  userOrders: (sessionId: string) => `${API_URL}/api/orders/user/${sessionId}`,
  
  // Admin
  adminShops: `${API_URL}/api/admin/shops`,
  verifyShop: (shopId: string) => `${API_URL}/api/admin/shops/${shopId}/verify`,
  updatePricing: (shopId: string) => `${API_URL}/api/admin/shops/${shopId}/pricing`,
  
  // Static files
  pfp: (filename: string) => `${API_URL}/pfp/${filename}`,
  processed: (filename: string) => `${API_URL}/processed/${filename}`,
};
