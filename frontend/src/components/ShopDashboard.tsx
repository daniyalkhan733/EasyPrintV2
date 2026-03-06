"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, FileText, Printer, Truck, Package, ChevronDown, ChevronUp, Filter, Archive, LogOut, User, IndianRupee, ShoppingBag, MapPin, Store, Coins, Palette } from 'lucide-react';
import Image from 'next/image';
import { API_ENDPOINTS } from '@/lib/api';

interface FileConfig {
    name: string;
    pages: string;
    colorPages: string;
    sided: 'one-sided' | 'two-sided';
    copies: number;
    pageSize: string;
    // New fields from updated FileUpload
    printMode?: 'bw' | 'color' | 'mixed';
    bwPages?: number;
    colorPagesCount?: number;
    estimatedCost?: number;
    orientation?: string;
}

interface FileEntry {
  pdf_filename: string;
  original_name: string;
  config: FileConfig;
}

interface Order {
  order_id: string;
  files: (string | FileEntry)[];
  status: 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Completed';
  config?: FileConfig[];
  student_name: string;
  order_time: number;
}

// Helper to get PDF filename from files array (handles both old and new format)
const getPdfFilename = (file: string | FileEntry): string => {
  return typeof file === 'string' ? file : file.pdf_filename;
};

// Helper to get config array from order (handles both old and new format)
const getOrderConfig = (order: Order): FileConfig[] => {
  if (order.config && order.config.length > 0) {
    return order.config;
  }
  return order.files
    .filter((f): f is FileEntry => typeof f !== 'string' && 'config' in f)
    .map(f => f.config);
};

interface ShopInfo {
  shop_id: string;
  shop_name: string;
  username: string;
  location: string;
  profile_photo: string;
  pricing: {
    bw: number;
    color: number;
  };
}

type OrderStatus = 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Completed';
type ViewMode = 'active' | 'completed' | 'profile';

const statusIcons = {
  Pending: <Clock className="text-yellow-400" />,
  'In Progress': <Printer className="text-blue-400" />,
  'Ready for Pickup': <Package className="text-purple-400" />,
  Completed: <CheckCircle className="text-green-400" />,
};

interface ShopDashboardProps {
  shopId: string;
}

const ShopDashboard = ({ shopId }: ShopDashboardProps) => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [editedPricing, setEditedPricing] = useState({ bw: 1, color: 5 });

  useEffect(() => {
    fetchOrders();
    fetchShopInfo();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [shopId]);

  const fetchShopInfo = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.shopInfo(shopId));
      setShopInfo(response.data);
      if (response.data?.pricing) {
        setEditedPricing(response.data.pricing);
      }
    } catch (error) {
      console.error("Error fetching shop info:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('shop-auth');
    router.push('/shop/login');
  };

  const updatePricing = async () => {
    try {
      await axios.put(API_ENDPOINTS.shopUpdatePricing(shopId), { pricing: editedPricing });
      setShopInfo(prev => prev ? { ...prev, pricing: editedPricing } : prev);
      setIsEditingPricing(false);
    } catch (error) {
      console.error("Error updating pricing:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.shopViewOrders);
      setOrders(response.data.sort((a: Order, b: Order) => b.order_id.localeCompare(a.order_id)));
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await axios.put(API_ENDPOINTS.orderStatus(orderId), { status });
      setOrders(orders.map(order => order.order_id === orderId ? { ...order, status } : order));
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Separate active and completed orders
  const activeOrders = orders.filter(order => order.status !== 'Completed');
  const completedOrders = orders.filter(order => order.status === 'Completed');

  // Calculate stats
  const totalOrders = orders.length;
  const totalEarnings = completedOrders.reduce((acc, order) => {
    let orderTotal = 0;
    const orderConfig = getOrderConfig(order);
    orderConfig.forEach(file => {
      const bwPrice = shopInfo?.pricing.bw || 1;
      const colorPrice = shopInfo?.pricing.color || 5;
      // Use estimatedCost if available, otherwise calculate
      if (file.estimatedCost) {
        orderTotal += file.estimatedCost;
      } else {
        orderTotal += file.copies * bwPrice * 10; // Assuming 10 pages avg
      }
    });
    return acc + orderTotal;
  }, 0);

  // Apply filters
  const getFilteredOrders = () => {
    if (viewMode === 'profile') return [];
    const ordersToFilter = viewMode === 'active' ? activeOrders : completedOrders;
    
    if (statusFilter === 'All') {
      return ordersToFilter;
    }
    
    return ordersToFilter.filter(order => order.status === statusFilter);
  };

  const filteredOrders = getFilteredOrders();
  const selectedOrder = orders.find(o => o.order_id === selectedOrderId);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8 font-sans">
      <motion.div 
        className="container mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header with Shop Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-4 bg-gray-800 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
              {shopInfo?.profile_photo ? (
                <Image src={API_ENDPOINTS.pfp(shopInfo.profile_photo)} alt="Shop" width={56} height={56} className="object-cover w-full h-full" />
              ) : (
                <Store className="w-full h-full p-3 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-purple-400">{shopInfo?.shop_name || 'Loading...'}</h1>
              <p className="text-sm text-gray-400 flex items-center gap-1"><MapPin size={14} /> {shopInfo?.location || 'N/A'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 sm:mt-0 flex items-center gap-2 bg-red-600/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/40 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-white">Dashboard</h2>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
            <motion.button
              onClick={() => {
                setViewMode('active');
                setStatusFilter('All');
              }}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === 'active' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Truck size={18} />
              Active Orders
              {activeOrders.length > 0 && (
                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  {activeOrders.length}
                </span>
              )}
            </motion.button>
            <motion.button
              onClick={() => {
                setViewMode('completed');
                setStatusFilter('All');
              }}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === 'completed' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Archive size={18} />
              Completed
              {completedOrders.length > 0 && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {completedOrders.length}
                </span>
              )}
            </motion.button>
            <motion.button
              onClick={() => setViewMode('profile')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === 'profile' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <User size={18} />
              Profile
            </motion.button>
          </div>
        </div>

        {/* Profile/Stats View */}
        {viewMode === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <StatCard icon={<ShoppingBag className="text-purple-400" />} label="Total Orders" value={totalOrders} />
            <StatCard icon={<CheckCircle className="text-green-400" />} label="Completed" value={completedOrders.length} />
            <StatCard icon={<Clock className="text-yellow-400" />} label="Pending" value={activeOrders.length} />
            <StatCard icon={<IndianRupee className="text-emerald-400" />} label="Total Earnings" value={`₹${totalEarnings}`} />
            
            <div className="md:col-span-2 lg:col-span-4 bg-gray-800 p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Pricing Details (EP-Coins per page)</h3>
                {!isEditingPricing ? (
                  <button
                    onClick={() => setIsEditingPricing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition"
                  >
                    Edit Pricing
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditedPricing(shopInfo?.pricing || { bw: 1, color: 5 });
                        setIsEditingPricing(false);
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={updatePricing}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm transition"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">B&W Price (per page)</p>
                  {isEditingPricing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editedPricing.bw}
                      onChange={(e) => setEditedPricing({ ...editedPricing, bw: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-gray-600 rounded text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="B&W price per page"
                      placeholder="Enter B&W price"
                    />
                  ) : (
                    <p className="text-2xl font-bold flex items-center gap-1">
                      <Coins size={20} className="text-yellow-400" /> {shopInfo?.pricing.bw || 1}
                    </p>
                  )}
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Color Price (per page)</p>
                  {isEditingPricing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editedPricing.color}
                      onChange={(e) => setEditedPricing({ ...editedPricing, color: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-gray-600 rounded text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Color price per page"
                      placeholder="Enter color price"
                    />
                  ) : (
                    <p className="text-2xl font-bold flex items-center gap-1">
                      <Coins size={20} className="text-yellow-400" /> {shopInfo?.pricing.color || 5}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                These prices are shown to students when placing orders. Changes will apply to new orders immediately.
              </p>
            </div>
          </motion.div>
        )}
        
        {viewMode !== 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            className="lg:col-span-1 bg-gray-800 p-6 rounded-xl shadow-2xl"
            layout
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold flex items-center">
                {viewMode === 'active' ? (
                  <><Truck className="mr-3"/> Active Orders</>
                ) : (
                  <><Archive className="mr-3"/> Completed Orders</>
                )}
              </h2>
              
              {/* Status Filter Dropdown */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'All')}
                  className="bg-gray-700 border border-gray-600 p-2 pl-3 pr-8 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer"
                  title="Filter orders by status"
                >
                  <option value="All">All Status</option>
                  {viewMode === 'active' ? (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Ready for Pickup">Ready</option>
                    </>
                  ) : (
                    <option value="Completed">Completed</option>
                  )}
                </select>
                <Filter size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
            
            <AnimatePresence mode="popLayout">
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {filteredOrders.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 text-gray-400"
                  >
                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No {viewMode === 'active' ? 'active' : 'completed'} orders</p>
                  </motion.div>
                ) : (
                  filteredOrders.map(order => (
                    <motion.div 
                      key={order.order_id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSelectedOrderId(order.order_id)} 
                      className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                        selectedOrderId === order.order_id 
                          ? 'border-purple-500 bg-gray-700' 
                          : 'border-gray-700 hover:border-purple-400 hover:bg-gray-700/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{order.order_id}</p>
                          <p className="text-sm text-gray-400">{order.student_name}</p>
                          <p className="text-xs text-gray-500">{new Date(order.order_time * 1000).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm hidden sm:inline">{order.status}</span>
                          {statusIcons[order.status]}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </AnimatePresence>
          </motion.div>
          
          <div className="lg:col-span-2">
            <AnimatePresence>
              {selectedOrder ? (
                <motion.div 
                  key={selectedOrder.order_id}
                  className="bg-gray-800 p-6 rounded-xl shadow-2xl"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-bold mb-2 text-purple-300">{selectedOrder.order_id}</h2>
                      <p className="text-sm text-gray-400">{selectedOrder.files.length} file(s) • {selectedOrder.student_name}</p>
                    </div>
                    <div className="text-right space-x-2">
                        <label htmlFor="status-select" className="text-sm text-gray-400">Status</label>
                        <select 
                            id="status-select"
                            onChange={(e) => updateOrderStatus(selectedOrder.order_id, e.target.value as Order['status'])} 
                            value={selectedOrder.status} 
                            className="bg-gray-700 border border-gray-600 p-2 rounded-md mt-1 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Ready for Pickup">Ready for Pickup</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <h3 className="text-xl font-semibold border-b border-gray-700 pb-2">Files & Print Options</h3>
                    {selectedOrder.files.map((fileEntry, index) => {
                      const config = typeof fileEntry === 'string' 
                        ? (selectedOrder.config?.[index] || { name: fileEntry, copies: 1, pages: 'All', sided: 'one-sided', pageSize: 'A4' } as FileConfig)
                        : fileEntry.config;
                      const pdfFilename = getPdfFilename(fileEntry);
                      return (
                        <FileConfigCard key={index} file={config} pdfFilename={pdfFilename} />
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-800 p-6 rounded-xl shadow-2xl">
                  <p className="text-gray-400 text-lg">Select an order to see the details</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
        )}
      </motion.div>
    </div>
  );
};

const FileConfigCard = ({ file, pdfFilename }: { file: FileConfig; pdfFilename: string }) => {
    const [isOpen, setIsOpen] = useState(true);
    
    const getPrintModeLabel = (mode?: string) => {
        switch(mode) {
            case 'bw': return 'Black & White';
            case 'color': return 'Full Color';
            case 'mixed': return 'Mixed (B&W + Color)';
            default: return 'N/A';
        }
    };

    const handlePrint = () => {
        const printUrl = `http://localhost:5001/processed/${pdfFilename}`;
        window.open(printUrl, '_blank');
    };
    
    return (
        <motion.div className="bg-gray-700/50 rounded-lg overflow-hidden">
            <div className="w-full p-4 flex justify-between items-center">
                <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setIsOpen(!isOpen)} title="Toggle details">
                    <div className="flex items-center gap-3">
                        <FileText size={18} className="text-gray-400" />
                        <p className="font-medium text-lg">{file.name}</p>
                        {file.estimatedCost !== undefined && (
                            <span className="text-sm text-yellow-400 flex items-center gap-1">
                                <Coins size={14} /> {file.estimatedCost}
                            </span>
                        )}
                    </div>
                    {isOpen ? <ChevronUp className="ml-2" /> : <ChevronDown className="ml-2" />}
                </button>
                <button
                    onClick={handlePrint}
                    className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    title="Open PDF for printing"
                >
                    <Printer size={16} /> Print PDF
                </button>
            </div>
            <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4"
                >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <InfoItem label="Copies" value={file.copies} />
                        <InfoItem label="Page Size" value={file.pageSize} />
                        <InfoItem label="Sided" value={file.sided} />
                        <InfoItem label="Pages" value={file.pages} />
                        {file.printMode && (
                            <InfoItem label="Print Mode" value={getPrintModeLabel(file.printMode)} />
                        )}
                        {file.printMode === 'mixed' && file.colorPages && (
                            <InfoItem label="Color Pages" value={file.colorPages} />
                        )}
                        {file.bwPages !== undefined && (
                            <InfoItem label="B&W Pages" value={file.bwPages} />
                        )}
                        {file.colorPagesCount !== undefined && (
                            <InfoItem label="Color Pages" value={file.colorPagesCount} />
                        )}
                        {file.orientation && (
                            <InfoItem label="Orientation" value={file.orientation} />
                        )}
                    </div>
                    {file.estimatedCost !== undefined && (
                        <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                            <p className="text-yellow-400 font-medium flex items-center gap-2">
                                <Coins size={16} />
                                Estimated Cost: {file.estimatedCost} coins
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    )
}

const InfoItem = ({label, value}: {label: string, value: string | number}) => (
    <div className="bg-gray-600/50 p-3 rounded-md">
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="font-semibold text-base">{value}</p>
    </div>
)

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <motion.div 
    className="bg-gray-800 p-6 rounded-xl flex items-center gap-4"
    whileHover={{ scale: 1.02 }}
  >
    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </motion.div>
);

export default ShopDashboard;
