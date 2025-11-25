import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Target, Brain, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center space-y-8">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Transform Your Business
              </span>
              <br />
              <span className="text-foreground">With AI-Powered Growth</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Track your daily actions, define ambitious goals, and receive personalized AI coaching
              to achieve predictable business growth through disciplined execution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                Get Started Now <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Growth Framework Section */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">The Growth Action Method</h2>
            <p className="text-xl text-muted-foreground">
              Transform chaos into structured growth with our proven framework
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Growth Framework</h3>
                <p className="text-muted-foreground">
                  Define clear financial milestones from your 5-year vision down to daily actions
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold">Weekly Action</h3>
                <p className="text-muted-foreground">
                  Focus on high-impact weekly tasks that move the needle on your business
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Daily Execution</h3>
                <p className="text-muted-foreground">
                  Track your daily activities, habits, and learning to maintain momentum
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">AI Growth Advisor</h3>
                <p className="text-muted-foreground">
                  Receive personalized insights and actionable recommendations based on your data
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2">
            <CardContent className="p-12 text-center">
              <blockquote className="space-y-6">
                <p className="text-2xl lg:text-3xl font-semibold leading-relaxed">
                  "Your Business Grows When You Stay{" "}
                  <span className="text-primary">Consistent</span>, Take{" "}
                  <span className="text-secondary">Bold Action</span>, Build Your{" "}
                  <span className="text-accent">Authority</span>, And Stay Clear About{" "}
                  <span className="text-primary">Goals</span>."
                </p>
                <p className="text-xl text-muted-foreground font-medium">
                  Growth Is Not Luck – It's Discipline.
                </p>
                <footer className="text-lg font-semibold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  — SREEJITH KC
                </footer>
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Programs Section */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Growth Programs</h2>
            <p className="text-xl text-muted-foreground">
              Choose the program that fits your growth journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8 space-y-4">
                <h3 className="text-2xl font-bold">Business Buddy</h3>
                <p className="text-muted-foreground">
                  Your personal growth companion for consistent daily progress
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary border-2">
              <CardContent className="p-8 space-y-4">
                <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full mb-2">
                  POPULAR
                </div>
                <h3 className="text-2xl font-bold">Business Catalyst Hub</h3>
                <p className="text-muted-foreground">
                  Accelerate your growth with advanced tracking and AI insights
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 space-y-4">
                <h3 className="text-2xl font-bold">Growth Challenge</h3>
                <p className="text-muted-foreground">
                  90-day intensive program to transform your business trajectory
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Start Your Growth Journey <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
