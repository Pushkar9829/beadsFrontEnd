import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';
import { useAuthStore } from './authStore';

function totals(items) {
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const amount = items.reduce((s, i) => s + i.lineTotal, 0);
  return { count, amount };
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      synced: false,

      getTotals: () => totals(get().items),

      async fetchServer() {
        const { data } = await api.get('/cart');
        set({ items: data.cart.items, synced: true });
      },

      async addProduct(product, quantity = 1) {
        const user = useAuthStore.getState().user;
        if (user) {
          const { data } = await api.post('/cart/items', {
            kind: 'product',
            productId: product._id,
            quantity,
          });
          set({ items: data.cart.items });
          return;
        }
        const items = [...get().items];
        const existing = items.find((i) => i.kind === 'product' && i.productId === product._id);
        if (existing) {
          existing.quantity += quantity;
          existing.lineTotal = existing.quantity * existing.unitPrice;
        } else {
          items.push({
            _id: `local-${Date.now()}`,
            kind: 'product',
            productId: product._id,
            quantity,
            unitPrice: product.price,
            lineTotal: product.price * quantity,
            snapshot: {
              name: product.name,
              slug: product.slug,
              image: product.images?.[0],
              colorHex: product.colorHex,
              family: product.family,
            },
          });
        }
        set({ items });
      },

      async addCustom(payload) {
        const user = useAuthStore.getState().user;
        if (user) {
          const { data } = await api.post('/cart/items', { kind: 'custom_bracelet', ...payload });
          set({ items: data.cart.items });
          return;
        }
        const items = [
          ...get().items,
          {
            _id: `local-${Date.now()}`,
            kind: 'custom_bracelet',
            quantity: 1,
            unitPrice: payload.snapshot?.pricing?.total || 0,
            lineTotal: payload.snapshot?.pricing?.total || 0,
            snapshot: payload.snapshot,
            ...payload,
          },
        ];
        set({ items });
      },

      async updateQty(itemId, quantity) {
        const user = useAuthStore.getState().user;
        if (user && !String(itemId).startsWith('local-')) {
          const { data } = await api.patch(`/cart/items/${itemId}`, { quantity });
          set({ items: data.cart.items });
          return;
        }
        set({
          items: get().items.map((i) =>
            i._id === itemId
              ? { ...i, quantity, lineTotal: quantity * i.unitPrice }
              : i
          ),
        });
      },

      async remove(itemId) {
        const user = useAuthStore.getState().user;
        if (user && !String(itemId).startsWith('local-')) {
          const { data } = await api.delete(`/cart/items/${itemId}`);
          set({ items: data.cart.items });
          return;
        }
        set({ items: get().items.filter((i) => i._id !== itemId) });
      },

      async clear() {
        const user = useAuthStore.getState().user;
        if (user) {
          const { data } = await api.delete('/cart');
          set({ items: data.cart.items });
          return;
        }
        set({ items: [] });
      },

      async onLogin() {
        const localItems = get().items.filter((i) => String(i._id).startsWith('local-'));
        if (localItems.length) {
          await api.post('/cart/merge', { items: localItems });
        }
        await get().fetchServer();
      },

      onLogout() {
        set({ items: [], synced: false });
      },
    }),
    { name: 'kuberstones-cart' }
  )
);
