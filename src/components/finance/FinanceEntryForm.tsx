import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Send } from 'lucide-react';

const entrySchema = z.object({
  entry_type: z.enum(['income', 'expenditure'], { required_error: 'Select entry type' }),
  category: z.string().trim().min(1, 'Category is required').max(100),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().trim().min(1, 'Description is required').max(500),
  transaction_date: z.string().min(1, 'Date is required'),
  reference_number: z.string().max(100).optional(),
});

type EntryFormValues = z.infer<typeof entrySchema>;

const incomeCategories = ['Tithes', 'Offerings', 'Special Giving', 'Fundraiser', 'Donations', 'Other Income'];
const expenditureCategories = ['Ministry Expenses', 'Events', 'Equipment', 'Transport', 'Printing', 'Welfare', 'Missions', 'Utilities', 'Other Expense'];

export default function FinanceEntryForm() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [submitMode, setSubmitMode] = useState<'draft' | 'submit'>('draft');

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      entry_type: 'income',
      category: '',
      amount: 0,
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: '',
    },
  });

  const entryType = form.watch('entry_type');
  const categories = entryType === 'income' ? incomeCategories : expenditureCategories;

  const mutation = useMutation({
    mutationFn: async (values: EntryFormValues) => {
      const payload = {
        entry_type: values.entry_type,
        category: values.category,
        amount: values.amount,
        description: values.description,
        transaction_date: values.transaction_date,
        recorded_by: user!.id,
        status: submitMode === 'submit' ? 'submitted' : 'draft',
        is_submitted: submitMode === 'submit',
        submitted_at: submitMode === 'submit' ? new Date().toISOString() : null,
        reference_number: values.reference_number || null,
      };
      const { error } = await supabase.from('finance_entries').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-entries'] });
      toast({ title: submitMode === 'submit' ? 'Entry submitted for approval' : 'Draft saved', description: 'Finance entry recorded successfully.' });
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const onSubmit = (values: EntryFormValues) => mutation.mutate(values);

  return (
    <Card className="border-border/50 max-w-2xl">
      <CardHeader>
        <CardTitle className="font-display">New Finance Entry</CardTitle>
        <CardDescription>Record income or expenditure. Save as draft or submit for approval.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="entry_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Type</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(v); form.setValue('category', ''); }} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expenditure">Expenditure</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (KES)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min="0" placeholder="0.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="transaction_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Describe the transaction..." rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="reference_number" render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g. Receipt #, M-Pesa code" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="outline" disabled={mutation.isPending} onClick={() => setSubmitMode('draft')}>
                {mutation.isPending && submitMode === 'draft' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Draft
              </Button>
              <Button type="submit" disabled={mutation.isPending} onClick={() => setSubmitMode('submit')}>
                {mutation.isPending && submitMode === 'submit' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit for Approval
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
