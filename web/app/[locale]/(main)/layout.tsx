import { Header, PageContainer } from '@/shared/components/layout';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />
      <PageContainer>{children}</PageContainer>
    </div>
  );
}
