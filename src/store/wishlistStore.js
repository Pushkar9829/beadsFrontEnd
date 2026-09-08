import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      },

      remove(id) {
        set({ items: get().items.filter((i) => i._id !== id) });
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
