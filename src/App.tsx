import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import IdeaGenerator from "./pages/IdeaGenerator";
import ExpandIdea from "./pages/ExpandIdea";
import PitchGenerator from "./pages/PitchGenerator";
import JudgeQA from "./pages/JudgeQA";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<IdeaGenerator />} />
          <Route path="/expand" element={<ExpandIdea />} />
          <Route path="/pitch" element={<PitchGenerator />} />
          <Route path="/judge-qa" element={<JudgeQA />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
          © 2025 HackMate | Built for Innovators, by Innovators 💡
        </footer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
