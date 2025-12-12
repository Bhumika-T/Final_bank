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
import { FileText } from "lucide-react";

const Cheque = () => {
  const [payeeName, setPayeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState("");
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

      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!accounts) {
        toast.error('Account not found');
        return;
      }

      await supabase.from('cheques').insert({
        account_id: accounts.id,
        payee_name: payeeName,
        amount: parsedAmount,
        cheque_number: chequeNumber || null,
        cheque_date: chequeDate || null,
        status: 'submitted',
      });

      toast.success(t('chequeSubmitted'));
      setPayeeName("");
      setAmount("");
      setChequeNumber("");
      setChequeDate("");
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
              <FileText className="h-6 w-6 text-accent" />
              {t('depositCheque')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payeeName">{t('payeeName')}</Label>
                <Input
                  id="payeeName"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">{t('chequeAmount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chequeNumber">{t('chequeNumber')}</Label>
                <Input
                  id="chequeNumber"
                  value={chequeNumber}
                  onChange={(e) => setChequeNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chequeDate">{t('chequeDate')}</Label>
                <Input
                  id="chequeDate"
                  type="date"
                  value={chequeDate}
                  onChange={(e) => setChequeDate(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-accent hover:opacity-90"
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

export default Cheque;
