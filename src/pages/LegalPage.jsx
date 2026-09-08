const PAGES = {
  returns: {
    title: 'Return & Exchange',
    eyebrow: 'Care',
    sections: [
      {
        heading: 'Window',
        body: 'Ready-made pieces may be returned or exchanged within 7 days of delivery, unused, with original packaging. Custom bracelets made to your purpose, intention, date of birth, and name are made to order and are not eligible for return, except for manufacturing defects.',
      },
      {
        heading: 'How to request',
        body: 'Write to us from the email on your account with the order number and whether you want a return or an exchange. We will share a pickup or drop-off instruction. Refunds, when approved, are issued to the original payment method after the piece is inspected.',
      },
      {
        heading: 'What we cannot accept',
        body: 'Worn, altered, or engraved pieces, items without tags or boxes, and custom studio strands cannot be exchanged for a different design. Crystal meaning is spiritual tradition, not a basis for return.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    eyebrow: 'Trust',
    sections: [
      {
        heading: 'What we collect',
        body: 'We collect the name, email, phone, and addresses you give us, along with order history, wishlist, and customization details such as date of birth used for Mulank. If you browse while signed in, we keep a session so your bag and account stay with you.',
      },
      {
        heading: 'How we use it',
        body: 'We use this information to fulfil orders, support your account, improve the atelier, and send order updates. We do not sell your personal data. Date of birth is used only to calibrate your bracelet and is not shared for marketing lists.',
      },
      {
        heading: 'Your choices',
        body: 'You may update your profile, request a copy of your data, or ask us to delete your account. Some records of completed orders are kept where the law requires. Contact us from the email on your account to make a request.',
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    eyebrow: 'Atelier',
    sections: [
      {
        heading: 'The store',
        body: 'Kuberstones sells jewellery and custom bracelets for personal use. Prices are in Indian Rupees. Product photos and 3D previews are a close guide; natural stones and handmade strands can vary slightly in tone and size.',
      },
      {
        heading: 'Orders & customization',
        body: 'Placing an order is an offer to buy. Custom pieces begin once you confirm the studio steps. Crystal associations are traditional and spiritual; they are not medical claims and do not replace professional care.',
      },
      {
        heading: 'Accounts',
        body: 'You are responsible for the details on your account and for keeping your password private. We may refuse or cancel an order in case of pricing error, stock limits, or suspected misuse.',
      },
    ],
  },
};

export default function LegalPage({ kind }) {
  const page = PAGES[kind] || PAGES.terms;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">{page.eyebrow}</p>
      <h1 className="mt-2 font-serif text-4xl gold-text">{page.title}</h1>
      <div className="mt-10 space-y-8">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-serif text-xl text-gold">{section.heading}</h2>
            <p className="mt-2 leading-relaxed text-lilac">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
