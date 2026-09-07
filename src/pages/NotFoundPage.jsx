import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function NotFoundPage() {
  return (
    <EmptyState title="Page not found" body="This path is not part of the Kuberstones house.">
      <Button to="/">Return home</Button>
    </EmptyState>
  );
}
