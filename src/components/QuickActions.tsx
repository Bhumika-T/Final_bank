import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Download, Upload, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const actions = [
  { icon: Send, label: "sendMoney", color: "bg-primary", path: "/send-money" },
  { icon: Download, label: "deposit", color: "bg-success", path: "/deposit" },
  { icon: Upload, label: "withdraw", color: "bg-warning", path: "/withdraw" },
  { icon: FileText, label: "cheque", color: "bg-accent", path: "/cheque" },
];

export const QuickActions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className="h-auto flex-col gap-2 p-4 hover:bg-muted/50 hover-scale"
              onClick={() => navigate(action.path)}
            >
              <div className={`w-12 h-12 rounded-full ${action.color} bg-opacity-10 flex items-center justify-center`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">{t(action.label)}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
