import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { BalanceCard } from "@/components/BalanceCard";
import { QuickActions } from "@/components/QuickActions";
import { TransactionList } from "@/components/TransactionList";
import { SavingsCard } from "@/components/SavingsCard";
import { LoanRecommendations } from "@/components/LoanRecommendations";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();
  const { t } = useTranslation();
  const language = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      } else {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      } else {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {t('welcomeBack')}, <span className="gradient-text">{userName}</span>
          </h2>
          <p className="text-muted-foreground">
            {t('happeningToday')}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Account Info */}
          <div className="lg:col-span-2 space-y-6">
            <BalanceCard />
            <QuickActions />
            <TransactionList />
          </div>

          {/* Right Column - Savings & Loans */}
          <div className="space-y-6">
            <SavingsCard />
            <LoanRecommendations />
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t('securityNote')}
          </p>
        </div>
      </main>

      <VoiceAssistant language={language} />
    </div>
  );
};

export default Index;
