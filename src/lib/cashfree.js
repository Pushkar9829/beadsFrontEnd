function loadScript() {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-cashfree-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Cashfree));
      existing.addEventListener('error', () => reject(new Error('Could not load Cashfree.')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.dataset.cashfreeSdk = 'true';
    script.onload = () => resolve(window.Cashfree);
    script.onerror = () => reject(new Error('Could not load Cashfree checkout.'));
    document.head.appendChild(script);
  });
}

export async function startCashfreeCheckout(session) {
  if (!session?.paymentSessionId) {
    throw new Error('Cashfree session is missing.');
  }
  const Cashfree = await loadScript();
  const cf = Cashfree({ mode: session.env === 'production' ? 'production' : 'sandbox' });
  return cf.checkout({
    paymentSessionId: session.paymentSessionId,
    redirectTarget: '_modal',
  });
}
