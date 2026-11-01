import { CheckoutExperience } from './CheckoutExperience';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const session = typeof query.session === 'string' ? query.session : null;
  return <CheckoutExperience checkoutLinkId={id} initialSessionId={session} />;
}
