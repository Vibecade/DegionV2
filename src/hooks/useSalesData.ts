import { useState, useEffect } from 'react';
import { TokenSale } from '../types';
import { salesData as fallbackData } from '../data/sales';

export function useSalesData() {
  const [salesData, setSalesData] = useState<TokenSale[]>(fallbackData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return { salesData, isLoading, error };
}