import { useState } from "react";
import { Header } from "@/components/Header";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Upload } from "lucide-react";
import { ensureAccountExists } from "@/lib/accountUtils";

const Withdraw = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const language = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('pleaseLogin'));
        navigate('/auth');
        return;
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error(t('invalidAmount'));
        return;
      }

      // Get user's account (create if doesn't exist)
      const accounts = await ensureAccountExists(user.id);

      if (!accounts) {
        toast.error('Account not found');
        return;
      }

      if (accounts.balance < parsedAmount) {
        toast.error('Insufficient balance');
        return;
      }

      await supabase.from('transactions').insert({
        account_id: accounts.id,
        type: 'debit',
        amount: parsedAmount,
        description: 'Cash Withdrawal',
        category: 'Withdrawal',
        status: 'completed',
      });

      await supabase
        .from('accounts')
        .update({ balance: accounts.balance - parsedAmount })
        .eq('id', accounts.id);

      toast.success(t('withdrawSuccess'));
      setAmount("");
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-6 w-6 text-warning" />
              {t('cashWithdraw')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('withdrawAmount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-warning hover:bg-warning/90"
                disabled={loading}
              >
                {loading ? t('submitting') : t('submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <VoiceAssistant language={language} />
    </div>
  );
};

export default Withdraw;
