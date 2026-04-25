import { logout } from '@/app/_actions/auth';

export const dynamic = 'force-dynamic';

export default async function LogoutPage() {
  await logout();
  return null;
}
