

export const MeshBackground = () => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />

            {/* Animated Orbs - Optimized with CSS Keyframes */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[80px] animate-float-1" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-secondary/20 rounded-full blur-[90px] animate-float-2" />
            <div className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] bg-accent/10 rounded-full blur-[70px] animate-float-3" />

            {/* Grid Overlay for Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>
    );
};
