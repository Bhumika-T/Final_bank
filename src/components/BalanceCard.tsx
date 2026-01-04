import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { ensureAccountExists } from "@/lib/accountUtils";

export const BalanceCard = () => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [balance, setBalance] = useState(0);
  const [accountNumber, setAccountNumber] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const data = await ensureAccountExists(user.id);
      
      if (data) {
        setBalance(Number(data.balance));
        setAccountNumber(data.account_number.slice(-4));
      }
    }
  };

  return (
    <Card className="glass-card border-2 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-primary opacity-5" />
      <CardHeader className="relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('accountBalance')}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {isBalanceVisible ? (
              <div className="text-4xl font-bold">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            ) : (
              <div className="text-4xl font-bold tracking-wider">₹ ***,***.**</div>
            )}
            <p className="text-xs text-muted-foreground">{t('accountNumber')}: ****{accountNumber}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="hover:bg-primary/10">
            {isBalanceVisible ? <EyeOff className="h-5 w-5 text-primary" /> : <Eye className="h-5 w-5 text-primary" />}
          </Button>
        </div>
        {!isBalanceVisible && <p className="text-xs text-muted-foreground mt-4">{t('clickToReveal')}</p>}
      </CardContent>
    </Card>
  );
};
