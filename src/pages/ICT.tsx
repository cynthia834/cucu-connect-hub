import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi } from 'lucide-react';

export default function ICT() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="ICT & Media" description="Livestream management, media, and content" />
      <Card className="border-border/50">
        <CardContent className="p-12 text-center">
          <Wifi className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">ICT & Media management module. Livestream toggles, broadcast logs, and editorial content will be managed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
