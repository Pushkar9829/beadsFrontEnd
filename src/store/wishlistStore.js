import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';
import { useAuthStore } from './authStore';

function toItem(product) {
  return {
    _id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    images: product.images || (product.image ? [product.image] : []),
    colorHex: product.colorHex,
    family: product.family,
    shortDescription: product.shortDescription,
  };
}

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      has: (id) => get().items.some((i) => i._id === id),

      add(product) {
        if (!product?._id || get().has(product._id)) return;
        set({ items: [toItem(product), ...get().items] });
        const user = useAuthStore.getState().user;
        if (user) api.post('/wishlist', { productId: product._id }).catch(() => {});
      },

      remove(id) {
        set({ items: get().items.filter((i) => i._id !== id) });
        const user = useAuthStore.getState().user;
        if (user) api.delete(`/wishlist/${id}`).catch(() => {});
      },

      async sync() {
        const user = useAuthStore.getState().user;
        if (!user) return;
        try {
          const localIds = get().items.map((i) => i._id);
          await api.post('/wishlist/merge', { productIds: localIds });
          const { data } = await api.get('/wishlist');
          set({ items: (data.items || []).map(toItem) });
        } catch {
          /* keep local */
        }
      },

      toggle(product) {
        if (!product?._id) return false;
        if (get().has(product._id)) {
          get().remove(product._id);
          return false;
        }
        get().add(product);
        return true;
      },
    }),
    { name: 'kuberstones-wishlist' }
  )
);
