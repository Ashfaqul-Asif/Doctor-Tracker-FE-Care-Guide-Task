import { redirect } from 'next/navigation';

export default function RootPage() {
  // There is no marketing surface — the app starts at the dashboard, and the dashboard
  // layout bounces anonymous visitors to /login.
  redirect('/dashboard');
}
