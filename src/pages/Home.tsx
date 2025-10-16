import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Lightbulb, Megaphone, Scale, BookmarkCheck } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-[var(--gradient-subtle)]">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              HackMate
            </h1>
            <p className="text-2xl text-muted-foreground mb-4">Your AI Hackathon Partner</p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              Transform your hackathon ideas into winning projects with AI-powered brainstorming, 
              detailed planning, pitch generation, and judge preparation.
            </p>
            
            <Link to="/ideas">
              <Button variant="gradient" size="lg" className="h-14 px-12 text-lg">
                <Sparkles className="mr-2 h-6 w-6" />
                Let's Go
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mt-20">
            <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <Sparkles className="h-10 w-10 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Generate Ideas</h3>
              <p className="text-sm text-muted-foreground">AI-powered project ideas based on your theme</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <Lightbulb className="h-10 w-10 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Expand Ideas</h3>
              <p className="text-sm text-muted-foreground">Get detailed breakdowns and plans</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <Megaphone className="h-10 w-10 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Create Pitch</h3>
              <p className="text-sm text-muted-foreground">Winning 60-second pitches</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <Scale className="h-10 w-10 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Judge Q&A</h3>
              <p className="text-sm text-muted-foreground">Practice tough judge questions</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <BookmarkCheck className="h-10 w-10 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Save & Export</h3>
              <p className="text-sm text-muted-foreground">Keep all your ideas organized</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
