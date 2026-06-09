import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIProduct } from "./catalog.functions";

export interface CartItem {
  product: UIProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: UIProduct, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (product, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
              isOpen: true,
            };
          }
          return { items: [...s.items, { product, quantity }], isOpen: true };
        }),
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.product.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((s) => ({
          items: quantity <= 0
            ? s.items.filter((i) => i.product.id !== id)
            : s.items.map((i) => (i.product.id === id ? { ...i, quantity } : i)),
        })),
      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
      subtotal: () => get().items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0),
    }),
    { name: "almatasawilein-cart", version: 2 },
  ),
);

interface WishlistState {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
    }),
    { name: "almatasawilein-wishlist" },
  ),
);
