
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  Flame, 
  ChevronRight,
  TrendingUp,
  Activity,
  Target,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  generateBallResult, 
  BallResult, 
  MatchFormat,
  BattingStrategy
} from "@/app/lib/game-engine";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";

/**
 * Hawkeye Trajectory Component
 * Visualizes the ball path based on the result
 */
function HawkeyeView({ result }: { result: BallResult | null }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (result) {
      setAnimate(false);
      const timer = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(timer);
    }
  }, [result]);

  if (!result) return null;

  const getPath = () => {
    if (result.isWicket) {
      return result.wicketType === 'Bowled' || result.wicketType === 'LBW' 
        ? "M 0 80 Q 20 95 35 85" 
        : "M 0 80 Q 30 20 60 40";
    }
    if (result.isBoundary) {
      return result.value === '6' ? "M 0 80 Q 50 -20 100 60" : "M 0 80 Q 50 40 100 90";
    }
    return result.runs === 0 ? "M 0 80 Q 20 95 35 70 Q 50 85 60 75" : "M 0 80 Q 30 40 80 70";
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
      <svg viewBox="0 0 100 100" className="w-full h-full max-w-[400px]">
        <line x1="0" y1="95" x2="100" y2="95" stroke="white" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
        <path
          d={getPath()}
          fill="none"
          stroke="url(#grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={cn("transition-all duration-700 ease-out", animate ? "stroke-dashoffset-0" : "stroke-dashoffset-100")}
          style={{ strokeDasharray: 200, strokeDashoffset: animate ? 0 : 200 }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor={result.isWicket ? "hsl(var(--destructive))" : "hsl(var(--accent))"} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function PitchPulse() {
  const [matchOvers, setMatchOvers] = useState<number | null>(null);
  const [oversInput, setOversInput] = useState("20");
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [lastResult, setLastResult] = useState<BallResult | null>(null);
  const [history, setHistory] = useState<BallResult[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWicketFlash, setIsWicketFlash] = useState(false);

  // Automatically determine format and strategy
  const matchFormat: MatchFormat = useMemo(() => {
    if (!matchOvers) return 'T20';
    if (matchOvers <= 20) return 'T20';
    if (matchOvers <= 50) return 'ODI';
    return 'TEST';
  }, [matchOvers]);

  const currentStrategy: BattingStrategy = useMemo(() => {
    if (!matchOvers) return 'BALANCED';
    const totalBalls = matchOvers * 6;
    const progress = balls / totalBalls;

    // Automated Strategy Logic:
    // 1. Aggressive in the first 10% (Powerplay feel)
    // 2. Aggressive in the last 15% (Death overs)
    // 3. Balanced elsewhere, but goes Defensive if wickets > 7
    if (wickets >= 8) return 'DEFENSIVE';
    if (progress < 0.1 || progress > 0.85) return 'AGGRESSIVE';
    return 'BALANCED';
  }, [matchOvers, balls, wickets]);

  const pitchImage = useMemo(() => {
    return PlaceHolderImages.find(img => img.id === 'cricket-pitch') || PlaceHolderImages[0];
  }, []);

  const resetGame = () => {
    setMatchOvers(null);
    setScore(0);
    setWickets(0);
    setBalls(0);
    setLastResult(null);
    setHistory([]);
    setIsGameOver(false);
  };

  const handleStartMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(oversInput);
    if (!isNaN(val) && val > 0) {
      setMatchOvers(val);
    }
  };

  const bowl = useCallback(() => {
    if (isGameOver || !matchOvers) return;

    const result = generateBallResult(matchFormat, false, { strategy: currentStrategy });
    
    setLastResult(result);
    setHistory((prev) => [result, ...prev].slice(0, 50));
    setScore((prev) => prev + result.runs);
    
    if (result.isWicket) {
      setWickets((prev) => prev + 1);
      setIsWicketFlash(true);
      setTimeout(() => setIsWicketFlash(false), 1000);
      if (wickets + 1 >= 10) setIsGameOver(true);
    }
    
    if (result.isLegal) {
      const newBalls = balls + 1;
      setBalls(newBalls);
      if (newBalls >= matchOvers * 6) setIsGameOver(true);
    }
  }, [matchOvers, isGameOver, balls, wickets, matchFormat, currentStrategy]);

  const currentOvers = `${Math.floor(balls / 6)}.${balls % 6}`;

  if (matchOvers === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md p-8 bg-card/50 backdrop-blur-2xl border-white/5 shadow-2xl space-y-8 rounded-[2rem]">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
              <Flame className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter">PITCH<span className="text-primary">PULSE</span></h1>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">New Innings Setup</p>
          </div>

          <form onSubmit={handleStartMatch} className="space-y-6">
            <div className="space-y-2 text-center">
              <Label htmlFor="overs" className="text-xs font-black uppercase tracking-widest opacity-50">Number of Overs</Label>
              <Input 
                id="overs"
                type="number" 
                value={oversInput} 
                onChange={(e) => setOversInput(e.target.value)}
                className="h-20 text-5xl font-black text-center bg-secondary/50 border-none rounded-2xl focus-visible:ring-primary"
                placeholder="20"
                min="1"
                max="100"
              />
            </div>
            <Button type="submit" className="w-full h-16 text-xl font-black italic rounded-2xl shadow-xl shadow-primary/20">
              START MATCH <ChevronRight className="ml-2 w-6 h-6" />
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {isWicketFlash && (
        <div className="fixed inset-0 z-50 bg-destructive/40 backdrop-blur-md flex items-center justify-center pointer-events-none">
          <h2 className="text-9xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">OUT!</h2>
        </div>
      )}

      <header className="w-full max-w-5xl px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter">PITCH<span className="text-primary">PULSE</span></h1>
        </div>
        <Button variant="ghost" onClick={resetGame} className="font-bold text-xs uppercase tracking-widest gap-2">
          <RotateCcw className="w-4 h-4" /> New Match
        </Button>
      </header>

      <main className="w-full max-w-5xl px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        <div className="lg:col-span-8 space-y-6">
          <Card className="relative aspect-video flex items-center justify-center bg-card/60 backdrop-blur-xl border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
            {pitchImage && (
              <div className="absolute inset-0 z-0 opacity-10">
                <Image src={pitchImage.imageUrl} alt="Cricket Pitch" fill className="object-cover grayscale" />
              </div>
            )}
            
            <HawkeyeView result={lastResult} />
            
            <div className="relative z-10 text-center">
              {lastResult ? (
                <div className="animate-in zoom-in duration-300">
                  <h2 className={cn(
                    "text-[10rem] font-black leading-none italic tracking-tighter drop-shadow-2xl",
                    lastResult.isWicket ? "text-destructive" : lastResult.isBoundary ? "text-accent" : "text-emerald-400"
                  )}>
                    {lastResult.value}
                  </h2>
                  <Badge variant="outline" className="mt-4 bg-black/60 font-black uppercase tracking-widest py-2 px-6">
                    {lastResult.isWicket ? lastResult.wicketType : (lastResult.isBoundary ? "Massive Shot" : "Standard Ball")}
                  </Badge>
                </div>
              ) : (
                <div className="opacity-20 flex flex-col items-center gap-4">
                  <Play className="w-20 h-20 text-primary" />
                  <p className="text-2xl font-black uppercase italic tracking-tighter">Ready to Bowl</p>
                </div>
              )}
            </div>

            {isGameOver && (
              <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
                <Trophy className="w-24 h-24 text-accent mb-6 animate-bounce" />
                <h3 className="text-6xl font-black italic uppercase tracking-tighter mb-4">Innings Over</h3>
                <div className="text-8xl font-black text-primary mb-8 italic">
                  {score}<span className="text-4xl opacity-30 mx-2">/</span>{wickets}
                </div>
                <Button onClick={resetGame} size="lg" className="h-20 px-16 text-2xl font-black italic rounded-3xl shadow-2xl shadow-primary/30">
                  START NEW MATCH
                </Button>
              </div>
            )}
          </Card>

          <Button 
            size="lg" 
            onClick={bowl} 
            disabled={isGameOver}
            className="w-full h-24 text-5xl font-black italic tracking-tighter rounded-[2.5rem] shadow-2xl shadow-primary/40 active:scale-[0.98] transition-all relative overflow-hidden group"
          >
            <span className="relative z-10">BOWL NOW</span>
            <Play className="absolute right-10 opacity-10 w-32 h-32 rotate-12 group-hover:scale-125 transition-transform" />
          </Button>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-primary p-8 border-none shadow-2xl rounded-[3rem] text-white space-y-8">
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Current Score</p>
              <div className="text-7xl font-black italic leading-none drop-shadow-lg">
                {score}<span className="text-3xl opacity-30 mx-2">/</span>{wickets}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-5 rounded-[2rem] border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 flex items-center gap-2"><Activity className="w-3 h-3" /> Overs</p>
                <p className="text-3xl font-black italic">{currentOvers}<span className="text-xs opacity-40 ml-1">/{matchOvers}</span></p>
              </div>
              <div className="bg-white/10 p-5 rounded-[2rem] border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Run Rate</p>
                <p className="text-3xl font-black italic">{balls > 0 ? (score / (balls / 6)).toFixed(2) : "0.00"}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 opacity-50" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Auto Strategy</span>
                </div>
                <Badge variant="secondary" className="bg-white/10 text-white border-none text-[10px] font-black px-3">{currentStrategy}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 opacity-50" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Match Format</span>
                </div>
                <Badge variant="secondary" className="bg-white/10 text-white border-none text-[10px] font-black px-3">{matchFormat}</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/40 backdrop-blur-xl border-none shadow-xl rounded-[2rem] space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Recent Deliveries</h4>
            <div className="flex flex-wrap gap-2">
              {history.length > 0 ? history.map((h, i) => (
                <div key={i} className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                  h.isWicket ? "bg-destructive text-white" :
                  h.isBoundary ? "bg-accent text-accent-foreground" :
                  h.value === '0' ? "bg-muted text-muted-foreground" :
                  "bg-secondary text-white"
                )}>
                  {h.value}
                </div>
              )) : (
                <p className="text-[10px] font-bold opacity-20 uppercase">Bowl to see history...</p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
