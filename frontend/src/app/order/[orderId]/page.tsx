"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  FileText,
  Printer,
  Package,
  Copy,
  Layers,
  Scissors,
  RefreshCw,
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

interface FileConfig {
  name: string;
  pages: string;
  colorPages: string;
  sided: "one-sided" | "two-sided";
  copies: number;
  pageSize: string;
}

interface FileEntry {
  pdf_filename: string;
  original_name: string;
  config: FileConfig;
}

interface OrderDetails {
  order_id: string;
  files: (string | FileEntry)[];
  status: "Pending" | "In Progress" | "Ready for Pickup" | "Completed";
  config?: FileConfig[];
  order_time: number;
}

// Helper to get config array from order (handles both old and new format)
const getOrderConfig = (order: OrderDetails): FileConfig[] => {
  if (order.config && order.config.length > 0) {
    return order.config;
  }
  return order.files
    .filter((f): f is FileEntry => typeof f !== 'string' && 'config' in f)
    .map(f => f.config);
};

const statusConfig = {
  Pending: {
    icon: <Clock />,
    color: "text-yellow-400",
    description: "Your order has been received and is waiting to be processed.",
  },
  "In Progress": {
    icon: <Printer />,
    color: "text-blue-400",
    description: "The shop is currently printing and preparing your order.",
  },
  "Ready for Pickup": {
    icon: <Package />,
    color: "text-purple-400",
    description: "Your order is ready for you to pick up.",
  },
  Completed: {
    icon: <CheckCircle />,
    color: "text-green-400",
    description: "Your order has been picked up.",
  },
};

const OrderStatus = () => {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderStatus = async () => {
      try {
        const response = await axios.get(
          API_ENDPOINTS.orderDetails(orderId)
        );
        setOrder(response.data);
      } catch (error) {
        console.error("Error fetching order status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="flex items-center gap-2">
          <RefreshCw className="animate-spin" />
          <p className="text-xl">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Order not found.</p>
      </div>
    );
  }

  const currentStatus = statusConfig[order.status];

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8 font-sans">
      <motion.div
        className="container mx-auto max-w-4xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-end mb-4">
          <Link
            href="/orders"
            className="inline-flex items-center px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-sm"
          >
            All Orders
          </Link>
        </div>

        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-purple-400">
              Order Status
            </h1>
            <div className="flex items-center gap-2 text-gray-400 mt-2">
              <span>{order.order_id}</span>
              <button onClick={() => copyToClipboard(order.order_id)} className="hover:text-white" title="Copy order ID">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-gray-500 text-sm">{new Date(order.order_time * 1000).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div
              className={`flex items-center gap-2 ${currentStatus.color} p-2 rounded-lg bg-gray-800`}
            >
              {currentStatus.icon}
              <span className="font-bold text-lg">{order.status}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {currentStatus.description}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
          <div className="bg-gray-800 p-6 rounded-lg">
            {getOrderConfig(order).map((file, index) => (
              <div key={index} className="border-b border-gray-700 last:border-b-0 py-4">
                <div className="flex items-center gap-4">
                  <FileText size={24} />
                  <p className="font-semibold text-lg">{file.name}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Layers size={16} />
                    <span>{file.copies} copies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    <span>Pages: {file.pages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    <span>Color: {file.colorPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Scissors size={16} />
                    <span>{file.sided}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderStatus;