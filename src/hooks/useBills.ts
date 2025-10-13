import { useState, useEffect } from 'react';
import { message } from 'antd';
import billService, { Bill } from '../services/billService';

export const useBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const data = await billService.getAllBills();
      setBills(data);
    } catch (error) {
      message.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const createBill = async (billData: Omit<Bill, 'id'>) => {
    try {
      const newBill = await billService.createBill(billData);
      setBills(prev => [...prev, newBill]);
      message.success('Bill created successfully');
      return newBill;
    } catch (error) {
      message.error('Failed to create bill');
      throw error;
    }
  };

  const updateBill = async (id: number, billData: Omit<Bill, 'id'>) => {
    try {
      const updatedBill = await billService.updateBill(id, billData);
      setBills(prev => prev.map(bill => bill.id === id ? updatedBill : bill));
      message.success('Bill updated successfully');
      return updatedBill;
    } catch (error) {
      message.error('Failed to update bill');
      throw error;
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  return {
    bills,
    loading,
    createBill,
    updateBill,
    refetch: fetchBills
  };
};