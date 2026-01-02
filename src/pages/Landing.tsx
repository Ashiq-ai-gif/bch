import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, Calendar, Bot, CheckCircle2, Zap, Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Navbar } from "@/components/layout/Navbar";

const Landing = () => {
  const navigate = useNavigate();
  const { isInstallable, install } = usePWAInstall();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navbar />
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI-Powered Business Growth Accelerator
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Transform chaos into consistent growth with disciplined action and intelligent AI insights
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg">
              Get Started Now
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* The Growth Action Method Framework */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">The Growth Action Method</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A proven framework that combines structured tracking with AI-powered guidance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Growth Framework & Details</h3>
            <p className="text-muted-foreground">
              Transform business chaos into structured, actionable steps with clear milestones and measurable outcomes.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Weekly Action</h3>
            <p className="text-muted-foreground">
              Focus on high-impact tasks that move the needle. Our AI identifies what matters most each week.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Activity Completed Today</h3>
            <p className="text-muted-foreground">
              Daily consistent execution is the key. Track habits, learning, and business metrics every single day.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Notes & Observations</h3>
            <p className="text-muted-foreground">
              Reflect on what works and what doesn't. Turn observations into actionable improvements.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">AI Growth Advisor</h3>
            <p className="text-muted-foreground">
              Get personalized coaching that analyzes your patterns and provides data-driven recommendations.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Sales Velocity Tracking</h3>
            <p className="text-muted-foreground">
              Visualize your growth trajectory. Compare your baseline to current performance in real-time.
            </p>
          </Card>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-8 md:p-12 text-center">
            <blockquote className="space-y-4">
              <p className="text-2xl md:text-3xl font-medium leading-relaxed">
                "Your Business Grows When You <span className="text-primary font-bold">Stay Consistent</span>, 
                take <span className="text-primary font-bold">bold action</span>, 
                build <span className="text-primary font-bold">Your authority</span>, 
                and <span className="text-primary font-bold">Stay clear about goals</span>."
              </p>
              <p className="text-xl text-muted-foreground pt-4">
                Growth is not Luck – It's <span className="font-bold text-foreground">discipline</span>.
              </p>
              <footer className="text-sm text-muted-foreground pt-4">
                — Sreejith KC
              </footer>
            </blockquote>
          </Card>
        </div>
      </div>

      {/* Program Tiers */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Growth Path</h2>
          <p className="text-lg text-muted-foreground">
            Select the program that fits your business stage and goals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 space-y-4">
            <h3 className="text-2xl font-bold">Business Buddy</h3>
            <p className="text-muted-foreground">
              Perfect for startups and solopreneurs looking to establish consistent growth habits.
            </p>
          </Card>

          <Card className="p-6 space-y-4 border-primary border-2 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <h3 className="text-2xl font-bold">Business Catalyst Hub</h3>
            <p className="text-muted-foreground">
              For growing businesses ready to scale with data-driven decision making.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-2xl font-bold">Growth Challenge</h3>
            <p className="text-muted-foreground">
              90-day intensive program for ambitious entrepreneurs aiming for breakthrough results.
            </p>
          </Card>
        </div>

        <div className="text-center pt-12">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Start Your Growth Journey Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;