import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function Reports() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports" description="System-wide reports and analytics" />
      <Card className="border-border/50">
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Reports dashboard. Finance reports, asset inventories, mission summaries, and program completion reports will be generated here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
