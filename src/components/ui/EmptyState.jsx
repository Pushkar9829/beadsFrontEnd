export default function EmptyState({ title, body, children }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h2 className="gold-text text-2xl">{title}</h2>
      {body && <p className="mt-3 text-lilac">{body}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
