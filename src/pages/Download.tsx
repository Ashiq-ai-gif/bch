import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, ExternalLink, Menu, PlusSquare, Share, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DownloadPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

            <div className="max-w-md w-full relative z-10 space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="mb-4 -ml-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>

                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg mb-4">
                        <Download className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Install the App</h1>
                    <p className="text-muted-foreground">
                        Get the full experience properly on your mobile device.
                    </p>
                </div>

                <Tabs defaultValue="ios" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ios">iOS (iPhone)</TabsTrigger>
                        <TabsTrigger value="android">Android</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ios">
                        <Card>
                            <CardHeader>
                                <CardTitle>Install on iPhone</CardTitle>
                                <CardDescription>
                                    Open this page in <span className="font-semibold text-blue-400">Safari</span> and follow these steps:
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-secondary rounded-lg shrink-0">
                                        <Share className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">1. Tap the Share button</h3>
                                        <p className="text-sm text-muted-foreground">It's usually at the bottom center of the screen.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-secondary rounded-lg shrink-0">
                                        <PlusSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">2. Select "Add to Home Screen"</h3>
                                        <p className="text-sm text-muted-foreground">You might need to scroll down a bit.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-secondary rounded-lg shrink-0">
                                        <Home className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">3. Tap "Add"</h3>
                                        <p className="text-sm text-muted-foreground">The app icon will appear on your home screen.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="android">
                        <Card>
                            <CardHeader>
                                <CardTitle>Install on Android</CardTitle>
                                <CardDescription>
                                    Open this page in <span className="font-semibold text-blue-400">Chrome</span> and follow these steps:
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-secondary rounded-lg shrink-0">
                                        <Menu className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">1. Tap the Menu icon</h3>
                                        <p className="text-sm text-muted-foreground">The three dots at the top right corner.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-secondary rounded-lg shrink-0">
                                        <Download className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">2. Tap "Install App"</h3>
                                        <p className="text-sm text-muted-foreground">Or "Add to Home screen" if Install isn't visible.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-secondary rounded-lg shrink-0">
                                        <ExternalLink className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">3. Confirm Installation</h3>
                                        <p className="text-sm text-muted-foreground">The app will be added to your app drawer.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default DownloadPage;
