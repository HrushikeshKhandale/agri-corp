export interface BillItem {
  companyName: string;
  category: string;
  type: string;
  subtype: string;
  unit: string;
  inwardPrice: number;
  salePrice: number;
  gst: number;
  discount: number;
  quantity: number;
  totalAmount: number;
}

export interface Bill {
  id?: number;
  customerName: string;
  contact: string;
  village: string;
  taluka: string;
  district: string;
  amountPayingNow: number;
  unpaidAmount: number;
  total: number;
  items: BillItem[];
  createdAt?: string;
  updatedAt?: string;
}