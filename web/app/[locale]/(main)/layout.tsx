import { Header, PageContainer } from '@/shared/components/layout';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageContainer>{children}</PageContainer>
    </div>
  );
}
