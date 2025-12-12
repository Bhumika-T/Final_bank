import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Banknote, ArrowRight } from "lucide-react";

const loans = [
  {
    id: 1,
    name: "Agriculture Loan",
    maxAmount: 100000,
    interestRate: 7.5,
    emi: 8500,
    eligible: true,
  },
  {
    id: 2,
    name: "Personal Loan",
    maxAmount: 50000,
    interestRate: 10.5,
    emi: 4500,
    eligible: true,
  },
];

export const LoanRecommendations = () => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Banknote className="h-5 w-5 text-accent" />
          Eligible Loans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loans.map((loan) => (
          <div
            key={loan.id}
            className="p-4 rounded-lg border border-border hover:border-primary transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{loan.name}</h4>
                <p className="text-xs text-muted-foreground">
                  Up to ₹{loan.maxAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">
                Eligible
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Interest Rate</p>
                <p className="font-semibold">{loan.interestRate}% p.a.</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. EMI</p>
                <p className="font-semibold">₹{loan.emi.toLocaleString('en-IN')}/mo</p>
              </div>
            </div>

            <Button size="sm" className="w-full bg-gradient-primary hover:opacity-90">
              Apply Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
