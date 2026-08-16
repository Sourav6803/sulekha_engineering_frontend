import { useState } from 'react';
import { purchasesApi } from '@/lib/api/purchases.api';
import type { PurchaseDocument } from '@/types/purchase';
import type { PurchaseListQuery } from '@/lib/api/purchases.api';

export function usePurchases() {
  const [data, setData] = useState<PurchaseDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = async (query?: PurchaseListQuery) => {
    setLoading(true);
    setError(null);

    try {
      const result = await purchasesApi.list(query);
      setData(result.data.items ?? []);
      return result;
    } catch (err) {
      setError((err as Error).message ?? 'Failed to fetch purchases');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    purchases: data,
    loading,
    error,
    fetchPurchases,
    createPurchase: purchasesApi.create,
    getPurchase: purchasesApi.get,
    updatePurchase: purchasesApi.update,
    deletePurchase: purchasesApi.remove,
    uploadInvoice: purchasesApi.uploadInvoice,
    completePurchase: purchasesApi.complete
  };
}
