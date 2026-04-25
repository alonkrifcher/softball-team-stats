import { loginAdmin } from '@/app/_actions/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">Admin login</h1>
      {sp.error === 'bad-password' ? <p className="text-red-600">Wrong password.</p> : null}
      {sp.error === 'throttled' ? <p className="text-red-600">Too many attempts. Wait 1 minute.</p> : null}
      <form action={loginAdmin} className="card space-y-3">
        <input type="hidden" name="next" value={sp.next ?? '/admin'} />
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" required autoComplete="current-password" />
        </div>
        <button type="submit" className="btn w-full">Sign in</button>
      </form>
    </div>
  );
}
