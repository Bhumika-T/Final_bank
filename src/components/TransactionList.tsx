import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export const TransactionList = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', user.id).single();
      if (accounts) {
        const { data } = await supabase.from('transactions').select('*').eq('account_id', accounts.id).order('created_at', { ascending: false }).limit(3);
        setTransactions(data || []);
      }
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">{t('recentTransactions')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No transactions yet</p>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === "credit" ? "bg-success/10" : "bg-destructive/10"}`}>
                  {transaction.type === "credit" ? <ArrowDownLeft className="h-5 w-5 text-success" /> : <ArrowUpRight className="h-5 w-5 text-destructive" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${transaction.type === "credit" ? "text-success" : "text-destructive"}`}>
                  {transaction.type === "credit" ? "+" : "-"}₹{Number(transaction.amount).toLocaleString('en-IN')}
                </p>
                <Badge variant="secondary" className="text-xs">{transaction.category}</Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
