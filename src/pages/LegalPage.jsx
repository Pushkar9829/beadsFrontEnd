import Button from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import InViewGroup from '../components/ui/InViewGroup';
import SectionHead from '../components/home/SectionHead';

const PAGES = {
  returns: {
    title: 'Return & Exchange',
    eyebrow: 'Care',
    body: 'Ready-made pieces have a short window. Custom strands, made to your purpose, are made to order.',
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
    body: 'We keep only what the atelier needs — to make the piece, fulfil the order, and hold your account.',
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
    eyebrow: 'The atelier',
    body: 'Kuberstones sells jewellery and custom bracelets for personal use. Prices are in Indian Rupees.',
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
  const crumbs = [
    { label: 'Home', to: '/' },
    { label: page.title },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 lotus-corner" />
      <div className="relative shell py-10 sm:py-12 md:py-16">
        <Breadcrumbs items={crumbs} />

        <div className="mt-8">
          <SectionHead
            eyebrow={page.eyebrow}
            title={page.title}
            body={page.body}
            to="/shop"
            action="Shop all →"
          />
        </div>

        <InViewGroup className="trust-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {page.sections.map((section, i) => (
            <div key={section.heading} className="trust-item" style={{ '--i': i }}>
              <article className="trust-card h-full p-6">
                <span className="text-[10px] uppercase tracking-[0.22em] text-gold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="mt-4 font-serif text-lg text-gold-light">{section.heading}</h2>
                <p className="mt-2 text-sm leading-relaxed text-lilac">{section.body}</p>
              </article>
            </div>
          ))}
        </InViewGroup>

        <InViewGroup className="finale-stage mt-12 sm:mt-16">
          <div className="finale px-5 py-14 text-center sm:px-8 sm:py-16">
            <p className="finale-kicker text-[11px] uppercase tracking-[0.28em] text-gold">Begin</p>
            <h2 className="finale-title mt-3 font-serif text-2xl gold-text sm:text-3xl">A bracelet with a reason.</h2>
            <p className="finale-copy mx-auto mt-3 max-w-md text-sm text-lilac">
              Start with a purpose in the studio, or walk the three houses until a piece finds you.
            </p>
            <div className="finale-actions mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Button to="/customize" className="w-full min-[420px]:w-auto">Customization</Button>
              <Button to="/shop" variant="ghost" className="w-full min-[420px]:w-auto">Shop All</Button>
            </div>
          </div>
        </InViewGroup>
      </div>
    </div>
  );
}
