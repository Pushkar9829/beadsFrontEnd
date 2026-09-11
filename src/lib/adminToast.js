let emit = null;

export function toast(message, type = 'ok') {
  emit?.({ id: Date.now() + Math.random(), message, type });
}

export function subscribeToasts(fn) {
  emit = fn;
  return () => {
    if (emit === fn) emit = null;
  };
}
