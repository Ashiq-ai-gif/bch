import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Profile
  const [profile, setProfile] = useState<{
    organization_name: string;
    phone: string;
    location: string;
    company_type: string;
    enrolled_program: string;
  }>({
    organization_name: "",
    phone: "",
    location: "",
    company_type: "",
    enrolled_program: "",
  });

  // Step 2: Business Context
  const [businessContext, setBusinessContext] = useState("");

  // Step 3: Financial Goals
  const [financialGoals, setFinancialGoals] = useState({
    baseline_monthly_revenue: "",
    five_year_target: "",
    year_4_target: "",
    year_3_target: "",
    year_2_target: "",
    year_1_target: "",
  });

  // Step 4: Monthly Breakdown
  const [monthlyTargets, setMonthlyTargets] = useState<Record<number, string>>(
    Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, ""]))
  );

  const progress = (step / 4) * 100;

  const handleProfileUpdate = async () => {
    if (!user) return;

    if (!profile.organization_name || !profile.phone || !profile.location || !profile.company_type || !profile.enrolled_program) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        organization_name: profile.organization_name,
        phone: profile.phone,
        location: profile.location,
        company_type: profile.company_type as any,
        enrolled_program: profile.enrolled_program as any,
      })
      .eq("user_id", user.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStep(2);
    }
  };

  const handleContextSubmit = () => {
    if (!businessContext.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe your business context",
        variant: "destructive",
      });
      return;
    }
    setStep(3);
  };

  const handleFinancialGoalsSubmit = () => {
    const allFilled = Object.values(financialGoals).every(v => v.trim() !== "");
    if (!allFilled) {
      toast({
        title: "Missing Information",
        description: "Please fill in all financial targets",
        variant: "destructive",
      });
      return;
    }
    setStep(4);
  };

  const handleFinalSubmit = async () => {
    if (!user) return;

    const allMonthsFilled = Object.values(monthlyTargets).every(v => v.trim() !== "");
    if (!allMonthsFilled) {
      toast({
        title: "Missing Information",
        description: "Please fill in all 12 monthly targets",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Save financial goals
    // First delete existing goals for this user to avoid duplicates
    const { error: deleteError } = await supabase
      .from("financial_goals")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting old goals:", deleteError);
      // Continue anyway, worst case we add a duplicate which is handled by dashboard now
    }

    const { error: goalsError } = await supabase
      .from("financial_goals")
      .insert({
        user_id: user.id,
        baseline_monthly_revenue: parseFloat(financialGoals.baseline_monthly_revenue),
        five_year_target: parseFloat(financialGoals.five_year_target),
        year_4_target: parseFloat(financialGoals.year_4_target),
        year_3_target: parseFloat(financialGoals.year_3_target),
        year_2_target: parseFloat(financialGoals.year_2_target),
        year_1_target: parseFloat(financialGoals.year_1_target),
      });

    if (goalsError) {
      setLoading(false);
      toast({
        title: "Error",
        description: goalsError.message,
        variant: "destructive",
      });
      return;
    }

    // Save monthly targets
    const currentYear = new Date().getFullYear();
    const monthlyData = Object.entries(monthlyTargets).map(([month, target]) => ({
      user_id: user.id,
      year: currentYear,
      month: parseInt(month),
      target_revenue: parseFloat(target),
    }));

    const { error: monthlyError } = await supabase
      .from("monthly_targets")
      .insert(monthlyData);

    setLoading(false);

    if (monthlyError) {
      toast({
        title: "Error",
        description: monthlyError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success!",
      description: "Your profile and goals have been set up",
    });

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Complete Your Profile</h1>
          <p className="text-center text-muted-foreground mb-4">Step {step} of 4</p>
          <Progress value={progress} className="w-full" />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Profile Information</CardTitle>
              <CardDescription>Tell us about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org_name">Organization Name *</Label>
                <Input
                  id="org_name"
                  value={profile.organization_name}
                  onChange={(e) => setProfile({ ...profile, organization_name: e.target.value })}
                  placeholder="Your Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="City, State, India"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_type">Company Type *</Label>
                <Select
                  value={profile.company_type}
                  onValueChange={(value) => setProfile({ ...profile, company_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proprietor">Proprietor</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="llp">LLP</SelectItem>
                    <SelectItem value="pvt_ltd">Pvt Ltd</SelectItem>
                    <SelectItem value="public_ltd">Public Ltd</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">Enrolled Program *</Label>
                <Select
                  value={profile.enrolled_program}
                  onValueChange={(value) => setProfile({ ...profile, enrolled_program: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_buddy">Business Buddy</SelectItem>
                    <SelectItem value="business_catalyst_hub">Business Catalyst Hub</SelectItem>
                    <SelectItem value="growth_challenge">90-Day Growth Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleProfileUpdate} disabled={loading} className="w-full">
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Business Context</CardTitle>
              <CardDescription>Help our AI understand your unique situation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="context">
                  Describe your business model, current challenges, and target market *
                </Label>
                <Textarea
                  id="context"
                  value={businessContext}
                  onChange={(e) => setBusinessContext(e.target.value)}
                  placeholder="Tell us about your business..."
                  rows={8}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                  Back
                </Button>
                <Button onClick={handleContextSubmit} className="w-full">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Goal Cascade</CardTitle>
              <CardDescription>Define your 5-year revenue journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseline">Baseline: Average Monthly Revenue Before Program (₹) *</Label>
                <Input
                  id="baseline"
                  type="number"
                  value={financialGoals.baseline_monthly_revenue}
                  onChange={(e) => setFinancialGoals({ ...financialGoals, baseline_monthly_revenue: e.target.value })}
                  placeholder="e.g., 500000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year5">Total Revenue Goal in 5 Years (₹) *</Label>
                <Input
                  id="year5"
                  type="number"
                  value={financialGoals.five_year_target}
                  onChange={(e) => setFinancialGoals({ ...financialGoals, five_year_target: e.target.value })}
                  placeholder="e.g., 100000000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year4">Year 4 Target (₹) *</Label>
                  <Input
                    id="year4"
                    type="number"
                    value={financialGoals.year_4_target}
                    onChange={(e) => setFinancialGoals({ ...financialGoals, year_4_target: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year3">Year 3 Target (₹) *</Label>
                  <Input
                    id="year3"
                    type="number"
                    value={financialGoals.year_3_target}
                    onChange={(e) => setFinancialGoals({ ...financialGoals, year_3_target: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year2">Year 2 Target (₹) *</Label>
                  <Input
                    id="year2"
                    type="number"
                    value={financialGoals.year_2_target}
                    onChange={(e) => setFinancialGoals({ ...financialGoals, year_2_target: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year1">Year 1 Target (₹) *</Label>
                  <Input
                    id="year1"
                    type="number"
                    value={financialGoals.year_1_target}
                    onChange={(e) => setFinancialGoals({ ...financialGoals, year_1_target: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                  Back
                </Button>
                <Button onClick={handleFinancialGoalsSubmit} className="w-full">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown - Year 1</CardTitle>
              <CardDescription>
                Break down your Year 1 target (₹{Number(financialGoals.year_1_target || 0).toLocaleString('en-IN')}) into monthly goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {MONTHS.map((month, index) => (
                  <div key={month} className="space-y-2">
                    <Label htmlFor={`month-${index + 1}`}>{month} (₹) *</Label>
                    <Input
                      id={`month-${index + 1}`}
                      type="number"
                      value={monthlyTargets[index + 1]}
                      onChange={(e) =>
                        setMonthlyTargets({ ...monthlyTargets, [index + 1]: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="w-full">
                  Back
                </Button>
                <Button onClick={handleFinalSubmit} disabled={loading} className="w-full">
                  Complete Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
