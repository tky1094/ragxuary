import { ActivityBar, Header, PageContainer } from '@/shared/components/layout';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <ActivityBar />
      <div className="ml-12 flex-1">
        <Header />
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
