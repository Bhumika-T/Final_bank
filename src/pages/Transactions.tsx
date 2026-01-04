import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowDownLeft, ArrowUpRight, CreditCard } from "lucide-react";
import { ensureAccountExists } from "@/lib/accountUtils";

const Transactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const language = useLanguage();

  useEffect(() => {
    fetchTransactions();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const accounts = await ensureAccountExists(user.id);

    if (accounts) {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', accounts.id)
        .order('created_at', { ascending: false });

      setTransactions(data || []);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              {t('allTransactions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transactions yet
              </p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === "credit"
                          ? "bg-success/10"
                          : "bg-destructive/10"
                      }`}
                    >
                      {transaction.type === "credit" ? (
                        <ArrowDownLeft className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        transaction.type === "credit" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {transaction.type === "credit" ? "+" : "-"}₹
                      {parseFloat(transaction.amount).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {transaction.category || transaction.type}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
      <VoiceAssistant language={language} />
    </div>
  );
};

export default Transactions;
