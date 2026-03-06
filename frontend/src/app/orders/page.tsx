"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { API_ENDPOINTS } from '@/lib/api';

interface Order {
  order_id: string;
  status: string;
  student_name: string;
  order_time: number;
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const studentAuth = localStorage.getItem('student-auth');
    if (studentAuth) {
        setUserId(JSON.parse(studentAuth).user_id);
    } else {
        let currentSessionId = localStorage.getItem('sessionId');
        if (!currentSessionId) {
          currentSessionId = uuidv4();
          localStorage.setItem('sessionId', currentSessionId);
        }
        setUserId(currentSessionId);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.userOrders(userId));
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white"><p>Loading your orders...</p></div>;
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white min-h-screen p-4 sm:p-8 font-sans">
      <motion.div
      className="container mx-auto max-w-4xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      >
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent mb-2">Your Orders</h1>
        <p className="text-gray-400">Track and manage your printing requests</p>
      </div>
      
      {orders.length > 0 ? (
        <div className="space-y-4">
        {orders.map((order, index) => (
          <motion.div
          key={order.order_id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, translateY: -4 }}
          >
          <Link href={`/order/${order.order_id}`} className="block group">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all duration-300 border border-gray-700 hover:border-purple-500 shadow-lg hover:shadow-purple-500/20">
            <div className="flex justify-between items-center">
              <div className="flex-1">
              <p className="font-semibold text-xl text-white group-hover:text-purple-300 transition-colors">{order.order_id}</p>
              <p className="text-gray-300 mt-1">{order.student_name}</p>
              <p className="text-gray-500 text-sm mt-2 flex items-center">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></span>
                {new Date(order.order_time * 1000).toLocaleString()}
              </p>
              </div>
              <div className="text-right ml-4">
              <span className={`inline-block px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                order.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                order.status === 'processing' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              </div>
            </div>
            </div>
          </Link>
          </motion.div>
        ))}
        </div>
      ) : (
        <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
        >
        <div className="inline-block p-8 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl border border-gray-600">
          <p className="text-gray-300 text-lg mb-4">You have no orders yet.</p>
          <Link href="/" className="inline-block px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold">
          Start Printing
          </Link>
        </div>
        </motion.div>
      )}
      </motion.div>
    </div>
  );
};

export default OrdersPage;
