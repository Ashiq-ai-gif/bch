import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Calendar, Star, Zap } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Welcome Back, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">John</span>
            </h1>
            <p className="text-muted-foreground mt-2">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Zap className="mr-2 h-4 w-4 text-accent" />
            Growth Streak: <span className="font-bold ml-1">0 Days</span>
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Month's Target</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0 / $0</div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-secondary w-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">0% complete</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-secondary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+0%</div>
              <p className="text-xs text-muted-foreground mt-2">vs. pre-program baseline</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Week's Score</CardTitle>
              <Star className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                <Star className="h-6 w-6 text-accent mr-1 fill-accent" />
                <Star className="h-6 w-6 text-accent mr-1 fill-accent" />
                <Star className="h-6 w-6 text-accent mr-1 fill-accent" />
                <Star className="h-6 w-6 text-muted mr-1" />
                <Star className="h-6 w-6 text-muted mr-1" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Based on AI analysis</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Velocity Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">Chart will appear here once you start tracking</p>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Daily Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Start tracking your daily activities to receive personalized AI recommendations.</p>
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                Record Today's Activities
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-secondary" />
                AI Growth Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">Complete your business profile to unlock personalized insights</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">Set your financial goals to activate tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
