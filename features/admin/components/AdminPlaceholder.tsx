import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageHeader, AdminReadOnlyNotice } from './AdminPrimitives';

export function AdminPlaceholder({
  title,
  description,
  sections,
  notice,
}: {
  title: string;
  description: string;
  sections: Array<{ title: string; status: string; detail: string }>;
  notice: string;
}) {
  return (
    <section className="space-y-6">
      <AdminPageHeader title={title} description={description} />
      <AdminReadOnlyNotice>{notice}</AdminReadOnlyNotice>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{section.status}</p>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{section.detail}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
