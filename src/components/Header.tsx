import { Button } from "@/components/ui/button";
import { Moon, Sun, Globe, Menu, LogOut, Home, Send, Download, Upload, FileText, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Header = () => {
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as 'en' | 'hi' | 'kn' || 'en';
    setLanguage(savedLang);
    i18n.changeLanguage(savedLang);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const changeLanguage = () => {
    const langs: ('en' | 'hi' | 'kn')[] = ['en', 'hi', 'kn'];
    const currentIndex = langs.indexOf(language);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    setLanguage(nextLang);
    i18n.changeLanguage(nextLang);
    localStorage.setItem('language', nextLang);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const menuItems = user ? [
    { icon: Home, label: t('home'), path: '/' },
    { icon: Send, label: t('sendMoney'), path: '/send-money' },
    { icon: Download, label: t('deposit'), path: '/deposit' },
    { icon: Upload, label: t('withdraw'), path: '/withdraw' },
    { icon: FileText, label: t('cheque'), path: '/cheque' },
    { icon: CreditCard, label: t('transactions'), path: '/transactions' },
  ] : [];

  const languageLabels = {
    en: 'English',
    hi: 'हिन्दी',
    kn: 'ಕನ್ನಡ'
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-xl bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">GB</span>
          </div>
          <h1 className="text-xl font-bold gradient-text">{t('graminBank')}</h1>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-4">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={location.pathname === item.path ? 'bg-muted' : ''}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={changeLanguage}
            className="hover:bg-muted"
          >
            <Globe className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-muted"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-muted hidden md:flex"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    className="justify-start"
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                ))}
                {user && (
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('logout')}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};


