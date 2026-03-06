"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, Coins } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/api';

const Wallet = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const authData = localStorage.getItem('student-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      setUserId(parsed.user_id);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchWallet = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.wallet(userId));
        setBalance(response.data.balance);
      } catch (error) {
        console.error("Error fetching wallet:", error);
      }
    };

    fetchWallet();
    const interval = setInterval(fetchWallet, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [userId]);

  if (balance === null) {
    return null;
  }

  return (
    <motion.div
      className="flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <WalletIcon size={20} />
      <span className="font-bold">EP-Coins:</span>
      <span className="flex items-center gap-1">
        <Coins size={16} />
        {balance.toFixed(2)}
      </span>
    </motion.div>
  );
};

export default Wallet;
