import { products } from "./products-data";

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "paymob_card" | "paymob_wallet";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export interface Order {
  id: string;
  number: string;
  customer: { name: string; phone: string; email: string; city: string };
  items: { productId: string; title: string; price: number; quantity: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  totalSpent: number;
  joinedAt: string;
}

export const orders: Order[] = [];

export const customers: Customer[] = [];

export const salesByDay: { date: string; sales: number; orders: number }[] = [];

export const stats = {
  totalRevenue: 0,
  totalOrders: 0,
  pendingOrders: 0,
  totalCustomers: 0,
  totalProducts: products.length,
  outOfStock: products.filter((p) => !p.inStock).length,
};

export const orderStatusLabel: Record<OrderStatus, { ar: string; en: string; color: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  processing: { ar: "قيد المعالجة", en: "Processing", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  shipped: { ar: "تم الشحن", en: "Shipped", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  delivered: { ar: "تم التسليم", en: "Delivered", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  cancelled: { ar: "ملغي", en: "Cancelled", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
};

export const paymentMethodLabel: Record<PaymentMethod, { ar: string; en: string }> = {
  cod: { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  paymob_card: { ar: "بطاقة (Paymob)", en: "Card (Paymob)" },
  paymob_wallet: { ar: "محفظة (Paymob)", en: "Wallet (Paymob)" },
};
