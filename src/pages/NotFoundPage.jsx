import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useSite } from '../store/contentStore';

export default function NotFoundPage() {
  const page = useSite().pages.notFound;
  return (
    <EmptyState title={page.title} body={page.body}>
      <Button to={page.to || '/'}>{page.cta}</Button>
    </EmptyState>
  );
}
