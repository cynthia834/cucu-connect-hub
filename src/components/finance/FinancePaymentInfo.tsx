import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Phone, Building2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: `${label} copied!` });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={copy} className="h-8 px-2">
      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
    </Button>
  );
}

export default function FinancePaymentInfo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
      {/* M-Pesa Paybill */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-success/10 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
            <Phone className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">M-Pesa Paybill</h3>
            <p className="text-sm text-muted-foreground">Lipa Na M-Pesa</p>
          </div>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Paybill Number</p>
                <p className="text-2xl font-bold font-display tracking-wider mt-1">247247</p>
              </div>
              <CopyButton text="247247" label="Paybill number" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Account Number</p>
                <p className="text-2xl font-bold font-display tracking-wider mt-1">734503</p>
              </div>
              <CopyButton text="734503" label="Account number" />
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <h4 className="text-sm font-semibold mb-2">How to Pay:</h4>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Go to M-Pesa on your phone</li>
              <li>Select <strong>Lipa Na M-Pesa</strong></li>
              <li>Select <strong>Pay Bill</strong></li>
              <li>Enter Business Number: <strong>247247</strong></li>
              <li>Enter Account Number: <strong>734503</strong></li>
              <li>Enter the amount</li>
              <li>Enter your M-Pesa PIN and confirm</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-primary/10 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Giving Information</h3>
            <p className="text-sm text-muted-foreground">CUCU Finance Office</p>
          </div>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Organization</p>
              <p className="font-medium mt-1">Chuka University Christian Union</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Accepted Giving Types</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Tithes', 'Offerings', 'Special Giving', 'Missions', 'Welfare', 'Fundraiser'].map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <p className="text-sm text-muted-foreground">
              After payment, please record your giving in the{' '}
              <strong className="text-foreground">Giving</strong> page with the M-Pesa
              confirmation code as the payment reference for reconciliation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
