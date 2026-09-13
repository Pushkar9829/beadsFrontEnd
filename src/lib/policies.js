export const POLICY_NAV = [
  { to: '/shipping', label: 'Shipping & Delivery' },
  { to: '/returns', label: 'Returns' },
  { to: '/exchanges', label: 'Exchanges' },
  { to: '/refunds', label: 'Refunds & Cancellations' },
  { to: '/faq', label: 'FAQs' },
  { to: '/account', label: 'Track Order' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/maintenance', label: 'Website Maintenance' },
  { to: '/grievance', label: 'Contact & Grievance' },
];

export const POLICIES = {
  maintenance: {
    slug: 'maintenance',
    title: 'Website Maintenance',
    eyebrow: 'Service availability',
    description: 'When the Kuberstones website, catalogue or services may be unavailable, and how orders are confirmed.',
    sections: [
      {
        heading: 'Availability',
        paragraphs: [
          'Kuberstones aims to keep its website, product catalogue and customer services available and accurate. However, website features may occasionally be unavailable because of maintenance, upgrades, technical issues, third-party service interruptions or circumstances beyond our reasonable control.',
        ],
      },
      {
        heading: 'Changes to the site',
        paragraphs: [
          'We may update, suspend or discontinue any website feature, product, price, offer or service when necessary. We will make reasonable efforts to communicate material changes where appropriate.',
        ],
      },
      {
        heading: 'Orders are subject to confirmation',
        paragraphs: [
          'Product availability, pricing, delivery timelines and offers are subject to change. An order is subject to acceptance and confirmation by Kuberstones.',
        ],
      },
    ],
  },
  returns: {
    slug: 'returns',
    title: 'Return Policy',
    eyebrow: 'Customer care',
    description: 'When a Kuberstones order may be returned, and how to request a review.',
    sections: [
      {
        heading: 'Our aim',
        paragraphs: [
          'We want customers to receive the product they ordered in proper condition. Return eligibility depends on the nature and condition of the product.',
        ],
      },
      {
        heading: 'Personalized and customized pieces',
        paragraphs: [
          'Change-of-mind returns may not be available for products that are personalized, customized, prepared or energized specifically for a customer once preparation has started. This is because such products may not be suitable for resale.',
        ],
      },
      {
        heading: 'When a return may be requested',
        paragraphs: [
          'Where applicable, customers may request a return or remedy for issues such as:',
        ],
        bullets: [
          'Wrong product received',
          'Product materially damaged in transit',
          'Missing product or material part of the order',
          'Product materially different from the description or order',
          'Other eligible defects or issues covered by applicable law or the applicable product policy',
        ],
      },
      {
        heading: 'How to request',
        paragraphs: [
          'Customers should contact support as soon as reasonably possible after delivery and provide the order number, photographs or video where relevant, and a clear description of the issue. Return approval and the applicable resolution will depend on verification. Approved returns are collected through an iThink Logistics reverse pickup where a courier pickup is required.',
        ],
      },
    ],
  },
  exchanges: {
    slug: 'exchanges',
    title: 'Exchange Policy',
    eyebrow: 'Customer care',
    description: 'When Kuberstones may exchange or replace a piece, and what natural variation is not a defect.',
    sections: [
      {
        heading: 'How we evaluate exchanges',
        paragraphs: [
          'Exchange requests are evaluated based on the product and reason for the request.',
          'Customized, personalized, prepared or energized products are generally not eligible for exchange due to change of mind or preference once preparation has started.',
        ],
      },
      {
        heading: 'Incorrect, damaged or not-as-described products',
        paragraphs: [
          'If an incorrect, damaged, materially defective or materially not-as-described product is received, Kuberstones may offer replacement, exchange, refund or another appropriate remedy after verification, subject to applicable law and product-specific terms. Approved exchanges use an iThink reverse pickup for the original piece, then a new forward shipment for the replacement.',
        ],
      },
      {
        heading: 'Natural variation',
        paragraphs: [
          'Natural variations in colour, pattern, texture, shape, inclusions and markings in crystals, gemstones and Rudraksha are not by themselves evidence of a defect.',
        ],
      },
    ],
  },
  refunds: {
    slug: 'refunds',
    title: 'Refund & Cancellation Policy',
    eyebrow: 'Customer care',
    description: 'When an order may be cancelled, and how approved refunds are processed.',
    sections: [
      {
        heading: 'Cancellation',
        paragraphs: [
          'Orders may be cancelled before processing or customization begins, subject to the order status and applicable terms. Once a customized or personalized product has entered preparation, cancellation may no longer be possible.',
        ],
      },
      {
        heading: 'Approved refunds',
        paragraphs: [
          'Where a refund is approved, the amount and method of refund will depend on the reason for the refund and the payment method used. Approved refunds will generally be processed to the original payment method unless another lawful method is agreed. Refunds that follow a return are typically processed after the reverse pickup is verified.',
        ],
      },
      {
        heading: 'If we cannot fulfil an order',
        paragraphs: [
          'If an order cannot be fulfilled due to stock, operational or other reasons, Kuberstones may cancel the affected order and provide an appropriate refund for amounts actually received for that order.',
        ],
      },
      {
        heading: 'Statutory rights',
        paragraphs: [
          'Nothing in this policy limits any statutory consumer rights or remedies that cannot lawfully be excluded.',
        ],
      },
    ],
  },
  shipping: {
    slug: 'shipping',
    title: 'Shipping & Delivery Policy',
    eyebrow: 'Customer care',
    description: 'How Kuberstones processes, prepares and delivers ready-made and customized orders.',
    sections: [
      {
        heading: 'When we process an order',
        paragraphs: [
          'Orders are processed after successful payment or confirmation, subject to product availability and any customization or preparation requirements. Confirmed ready-to-ship and completed custom orders are booked through iThink Logistics for pickup and delivery.',
          'Customized spiritual bracelets may require additional preparation time compared with ready-to-ship products. The estimated processing and delivery timeline will be communicated on the product page, checkout or order confirmation where applicable.',
        ],
      },
      {
        heading: 'Timelines can change',
        paragraphs: [
          'Delivery timelines can be affected by courier operations, weather, holidays, remote locations, incorrect addresses, customer unavailability or other circumstances outside our reasonable control.',
        ],
      },
      {
        heading: 'Your address and contact details',
        paragraphs: [
          'Customers should provide a complete and accurate delivery address and reachable contact details. If a parcel is returned because of an incorrect or incomplete address or repeated delivery failure, additional shipping arrangements may be required.',
        ],
      },
      {
        heading: 'On delivery',
        paragraphs: [
          'Customers should inspect the package on delivery and contact Kuberstones promptly if there is visible transit damage or an order discrepancy.',
        ],
      },
    ],
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    description: 'How Kuberstones uses personal information for orders, customization and support.',
    sections: [
      {
        heading: 'How we use information',
        paragraphs: [
          'Kuberstones respects customer privacy and uses personal information for legitimate business purposes such as order processing, customization, customer support, delivery, payments, fraud prevention, service improvement and legally required compliance.',
        ],
      },
      {
        heading: 'Information we may hold',
        paragraphs: [
          'Information may include name, contact details, delivery address, order details, payment-related information handled by payment providers, and voluntarily provided customization details such as date of birth, zodiac sign, moon sign, purpose or intention.',
          'Customization information is used to support the requested recommendation or customization service. Customers should provide only information they are comfortable sharing for that purpose.',
        ],
      },
      {
        heading: 'Service providers',
        paragraphs: [
          'We may use trusted service providers such as payment processors, logistics partners, technology providers and communication providers where necessary to operate the business. Such providers may process information only for relevant services and subject to their own applicable terms and privacy practices.',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'We use reasonable administrative, technical and organizational measures to protect information. However, no online transmission or storage system can be guaranteed to be completely secure.',
        ],
      },
      {
        heading: 'Your questions',
        paragraphs: [
          'Customers may contact Kuberstones regarding questions about their personal information, subject to applicable law and verification requirements.',
        ],
      },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms & Conditions',
    eyebrow: 'Legal',
    description: 'Terms for using the Kuberstones website and placing an order.',
    sections: [
      {
        heading: 'Using the website',
        paragraphs: [
          'By using the Kuberstones website or placing an order, customers agree to use the website lawfully and provide accurate information required for ordering, delivery and customization.',
        ],
      },
      {
        heading: 'Catalogue and natural products',
        paragraphs: [
          'Product descriptions, images, specifications, prices and availability may be updated from time to time. Natural products may differ slightly from photographs because of natural variation, lighting, screen settings and individual characteristics.',
        ],
      },
      {
        heading: 'Spiritual and traditional information',
        paragraphs: [
          'Spiritual, astrological and traditional information provided on the website or through customer support is intended for informational and belief-based purposes. Kuberstones does not represent that any product will guarantee a particular financial, medical, relationship, career, personal or spiritual result.',
          'Customers remain responsible for deciding whether a product is suitable for their personal beliefs, practices or needs. Product information is not a substitute for professional medical, financial, legal or other specialist advice.',
        ],
      },
      {
        heading: 'Orders we may refuse or cancel',
        paragraphs: [
          'Kuberstones may refuse, cancel or limit an order where there is a legitimate operational, fraud-prevention, stock, pricing or compliance reason, subject to applicable law.',
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: [
          'Intellectual property in website content, branding, product descriptions, graphics and other original materials belongs to Kuberstones / Nexxgenn Technology or the relevant rights holder and may not be used without permission, except as permitted by law.',
        ],
      },
      {
        heading: 'Governing law',
        paragraphs: [
          'These terms are subject to applicable laws of India. Nothing here is intended to exclude consumer rights or legal remedies that cannot lawfully be excluded.',
        ],
      },
    ],
  },
  grievance: {
    slug: 'grievance',
    title: 'Contact & Grievance Redressal',
    eyebrow: 'Customer care',
    description: 'How to reach Kuberstones and raise a complaint.',
    sections: [
      {
        heading: 'How we handle complaints',
        paragraphs: [
          'Kuberstones aims to resolve customer questions and complaints fairly and efficiently.',
          'Customers should include their order number, registered contact details and a concise description of the issue. Complaints will be acknowledged and handled in accordance with applicable law and the company’s internal grievance process.',
        ],
      },
    ],
  },
};

export function getPolicy(kind) {
  return POLICIES[kind] || POLICIES.terms;
}

function stripMailto(value = '') {
  return String(value).replace(/^mailto:/i, '').trim();
}

export function companyContacts(footer = {}) {
  const email = stripMailto(footer.email) || 'hello@kuberstones.com';
  const grievanceEmail = stripMailto(footer.grievanceEmail) || email;
  return {
    brand: footer.brandName || 'Kuberstones',
    legalEntity: footer.legalEntity || 'Nexxgenn Technology',
    email,
    emailHref: `mailto:${email}`,
    phone: String(footer.supportPhone || '').trim(),
    address: String(footer.address || footer.location || '').trim(),
    grievanceOfficer: String(footer.grievanceOfficer || '').trim(),
    grievanceEmail,
    grievanceEmailHref: `mailto:${grievanceEmail}`,
  };
}
