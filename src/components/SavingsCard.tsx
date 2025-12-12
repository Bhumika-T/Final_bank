import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target } from "lucide-react";

export const SavingsCard = () => {
  const currentSavings = 25000;
  const savingsGoal = 50000;
  const progress = (currentSavings / savingsGoal) * 100;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-accent" />
          Savings Goal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-bold text-primary">
              ₹{currentSavings.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Goal</p>
            <p className="text-lg font-bold">
              ₹{savingsGoal.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-success">
          <TrendingUp className="h-4 w-4" />
          <span>On track to reach goal in 3 months</span>
        </div>
      </CardContent>
    </Card>
  );
};
