import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { InputOTP } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Send } from "lucide-react";
import { ensureAccountExists } from "@/lib/accountUtils";

const SendMoney = () => {
  const [recipientName, setRecipientName] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pendingTransfer, setPendingTransfer] = useState<null | { parsedAmount: number }>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const language = useLanguage();

  // listen for voice-send-money events to autofill and open the PIN dialog
  useEffect(() => {
    const handler = (e: any) => {
      const d = e.detail || {};
      if (d.recipientName) setRecipientName(d.recipientName);
      if (d.recipientAccount) setRecipientAccount(d.recipientAccount);
      if (typeof d.amount === 'number') setAmount(String(d.amount));
      // open PIN dialog to confirm/send
      setPendingTransfer({ parsedAmount: Number(d.amount || parseFloat(amount) || 0) });
      setPinDialogOpen(true);
    };
    window.addEventListener('voice-send-money', handler as EventListener);
    return () => window.removeEventListener('voice-send-money', handler as EventListener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      // before creating transaction, verify PIN
      setPendingTransfer({ parsedAmount });
      setPinDialogOpen(true);
      setLoading(false);
      return;

      // Update balance
      await supabase
        .from('accounts')
        .update({ balance: accounts.balance - parsedAmount })
        .eq('id', accounts.id);

      toast.success(t('transferSuccess'));
      setRecipientName("");
      setRecipientAccount("");
      setAmount("");
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndSend = async () => {
    if (!pendingTransfer) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('pleaseLogin'));
        navigate('/auth');
        return;
      }

      const parsedAmount = pendingTransfer.parsedAmount;

      // Get user's account (create if doesn't exist)
      const accounts = await ensureAccountExists(user.id);

      if (!accounts) {
        toast.error('Account not found');
        return;
      }

      // if account has pin_hash, verify
      if (accounts.pin_hash) {
        try {
          const { hashPin } = await import('@/lib/utils');
          const enteredHash = await hashPin(pinValue || '');
          if (enteredHash !== accounts.pin_hash) {
            toast.error(t('invalidPin'));
            return;
          }
        } catch (e) {
          toast.error(t('pinVerificationFailed'));
          return;
        }
      } else {
        // If no pin set, require user to set one before sending
        if (!pinValue || pinValue.length < 4) {
          toast.error(t('setPinFirst'));
          return;
        }
        try {
          const { hashPin } = await import('@/lib/utils');
          const newHash = await hashPin(pinValue);
          await supabase.from('accounts').update({ pin_hash: newHash }).eq('id', accounts.id);
          toast.success(t('pinSetSuccess'));
        } catch (e) {
          // continue
        }
      }

      if (accounts.balance < parsedAmount) {
        toast.error('Insufficient balance');
        return;
      }

      // Create transaction
      await supabase.from('transactions').insert({
        account_id: accounts.id,
        type: 'transfer',
        amount: parsedAmount,
        description: `Transfer to ${recipientName}`,
        category: 'Transfer',
        counterparty_name: recipientName,
        counterparty_account: recipientAccount,
        status: 'completed',
      });

      // Update balance
      await supabase
        .from('accounts')
        .update({ balance: accounts.balance - parsedAmount })
        .eq('id', accounts.id);

      toast.success(t('transferSuccess'));
      setRecipientName("");
      setRecipientAccount("");
      setAmount("");
      setPinValue("");
      setPendingTransfer(null);
      setPinDialogOpen(false);
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
              <Send className="h-6 w-6 text-primary" />
              {t('moneyTransfer')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">{t('recipientName')}</Label>
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientAccount">{t('recipientAccount')}</Label>
                <Input
                  id="recipientAccount"
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">{t('enterAmount')}</Label>
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
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loading}
              >
                {loading ? t('sending') : t('send')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
          <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('EnterPinToConfirm')}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="pin-otp">{t('pin')}</Label>
                <Input
                  id="pin-otp"
                  type="password"
                  inputMode="numeric"
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value)}
                  maxLength={6}
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => { setPinDialogOpen(false); setPendingTransfer(null); setPinValue(''); }}>{t('cancel')}</Button>
                <Button onClick={verifyAndSend} disabled={loading}>{loading ? '...' : t('confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <VoiceAssistant language={language} />
    </div>
  );
};

export default SendMoney;
