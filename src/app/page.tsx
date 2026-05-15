"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Trophy, 
  Settings, 
  RefreshCw, 
  Play, 
  Zap, 
  Activity,
  User,
  Info,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  generateBallResult, 
  BallResult, 
  MatchFormat,
  MATCH_FORMAT_CONFIGS
} from "@/app/lib/game-engine";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export default function PitchPulse() {
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('T20');
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [extras, setExtras] = useState(0);
  const [lastResult, setLastResult] = useState<BallResult | null>(null);
  const [history, setHistory] = useState<BallResult[]>([]);
  const [isWicketFlash, setIsWicketFlash] = useState(false);
  const [isFreeHit, setIsFreeHit] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const [weights, setWeights] = useState<{ wicket: number | null, extra: number | null }>({
    wicket: null,
    extra: null
  });

  const bowl = useCallback(() => {
    if (isGameOver) return;

    const engineWeights = {
      wicket: weights.wicket ?? MATCH_FORMAT_CONFIGS[matchFormat].wicketWeight,
      extra: weights.extra ?? MATCH_FORMAT_CONFIGS[matchFormat].extraWeight
    };

    const result = generateBallResult(matchFormat, isFreeHit, engineWeights);
    
    setLastResult(result);
    setHistory((prev) => [result, ...prev].slice(0, 50));
    
    setScore((prev) => prev + result.runs);
    if (result.isWicket) {
      setWickets((prev) => prev + 1);
      setIsWicketFlash(true);
      setTimeout(() => setIsWicketFlash(false), 1000);
      if (wickets + 1 >= 10) {
        setIsGameOver(true);
      }
    }
    
    if (result.type === 'EXTRA') {
      setExtras((prev) => prev + result.runs);
    }
    
    if (result.isLegal) {
      setBalls((prev) => prev + 1);
      const currentOvers = Math.floor((balls + 1) / 6);
      if (matchFormat !== 'TEST' && currentOvers >= MATCH_FORMAT_CONFIGS[matchFormat].maxOvers) {
        setIsGameOver(true);
      }
    }

    if (result.value === 'NB') {
      setIsFreeHit(true);
    } else {
      setIsFreeHit(false);
    }
  }, [isFreeHit, weights, isGameOver, wickets, matchFormat, balls]);

  const simulateOver = useCallback(() => {
    if (isGameOver) return;
    let ballsBowledThisOver = 0;
    const interval = setInterval(() => {
      if (ballsBowledThisOver < 6 && !isGameOver) {
        bowl();
        ballsBowledThisOver++;
      } else {
        clearInterval(interval);
      }
    }, 150);
  }, [bowl, isGameOver]);

  const resetGame = () => {
    setScore(0);
    setWickets(0);
    setBalls(0);
    setExtras(0);
    setLastResult(null);
    setHistory([]);
    setIsFreeHit(false);
    setIsGameOver(false);
    setIsWicketFlash(false);
  };

  const handleFormatChange = (value: MatchFormat) => {
    setMatchFormat(value);
    setWeights({ wicket: null, extra: null }); // Reset custom weights to format defaults
    resetGame();
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        bowl();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [bowl]);

  const overs = Math.floor(balls / 6);
  const ballsInOver = balls % 6;
  const strikeRate = balls > 0 ? ((score / balls) * 100).toFixed(2) : "0.00";
  const boundaries = history.filter(h => h.isBoundary).length;

  const currentConfig = MATCH_FORMAT_CONFIGS[matchFormat];
  const displayWicketWeight = weights.wicket ?? currentConfig.wicketWeight;
  const displayExtraWeight = weights.extra ?? currentConfig.extraWeight;

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 flex flex-col items-center p-4 md:p-8 relative overflow-hidden",
      isWicketFlash ? "bg-red-950/20" : ""
    )}>
      {isWicketFlash && (
        <div className="fixed inset-0 z-0 wicket-flash pointer-events-none" />
      )}

      <header className="w-full max-w-5xl flex flex-col md:flex-row gap-4 justify-between items-center mb-12 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl rotate-12 shadow-lg shadow-primary/20">
            <Zap className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
          </div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-white">
            Pitch<span className="text-primary">Pulse</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 justify-center">
          <Select value={matchFormat} onValueChange={handleFormatChange}>
            <SelectTrigger className="w-[140px] rounded-full bg-white/5 border-white/10 text-white font-medium focus:ring-primary">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-white">
              <SelectItem value="T20">T20 (20 Overs)</SelectItem>
              <SelectItem value="ODI">ODI (50 Overs)</SelectItem>
              <SelectItem value="TEST">TEST (Unlimited)</SelectItem>
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10">
                <Settings className="w-4 h-4 text-accent" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Probability Engine ({matchFormat})</DialogTitle>
              </DialogHeader>
              <div className="space-y-8 py-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-muted-foreground">Wicket Probability (%)</Label>
                    <span className="text-primary font-mono">{displayWicketWeight}%</span>
                  </div>
                  <Slider 
                    value={[displayWicketWeight]} 
                    onValueChange={(v) => setWeights(prev => ({ ...prev, wicket: v[0] }))}
                    max={20}
                    step={0.1}
                    className="cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Default for {matchFormat}: {currentConfig.wicketWeight}%</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-muted-foreground">Extra Probability (%)</Label>
                    <span className="text-primary font-mono">{displayExtraWeight}%</span>
                  </div>
                  <Slider 
                    value={[displayExtraWeight]} 
                    onValueChange={(v) => setWeights(prev => ({ ...prev, extra: v[0] }))}
                    max={20}
                    step={0.1}
                    className="cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Default for {matchFormat}: {currentConfig.extraWeight}%</p>
                </div>
                <Button variant="ghost" className="w-full text-xs" onClick={() => setWeights({ wicket: null, extra: null })}>
                  Reset to Format Defaults
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetGame}
            className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restart
          </Button>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-gradient-to-br from-card to-background border-white/5 shadow-2xl relative overflow-hidden h-[300px] flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            {lastResult ? (
              <div className="text-center space-y-4 animate-number-pop">
                <div className={cn(
                  "text-9xl font-headline font-black tracking-tighter drop-shadow-2xl",
                  lastResult.isWicket ? "text-destructive" : "text-primary",
                  lastResult.isBoundary ? "text-accent" : ""
                )}>
                  {lastResult.value}
                </div>
                <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest">
                  {lastResult.isWicket ? lastResult.wicketType : 
                   lastResult.extraType ? lastResult.extraType : 
                   lastResult.isBoundary ? "Spectacular Boundary!" : "Clean Delivery"}
                </p>
                {isFreeHit && (
                  <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-1.5 rounded-full text-sm font-bold uppercase animate-pulse">
                    <Zap className="w-4 h-4 fill-accent" />
                    Free Hit
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 text-muted-foreground/30">
                <Play className="w-20 h-20 mx-auto" />
                <p className="text-xl font-headline uppercase tracking-widest">Awaiting First Ball</p>
                <p className="text-xs uppercase tracking-widest">Format: {matchFormat}</p>
              </div>
            )}

            {isGameOver && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 p-8 text-center animate-in fade-in zoom-in duration-300">
                <Trophy className="w-16 h-16 text-accent mb-2" />
                <h2 className="text-4xl font-headline font-bold">Innings Complete</h2>
                <p className="text-2xl font-mono text-primary">{score} / {wickets}</p>
                <p className="text-muted-foreground max-w-xs">
                  {wickets >= 10 ? "All out!" : "Maximum overs reached."} The innings has come to a close.
                </p>
                <Button onClick={resetGame} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl">
                  Play Again
                </Button>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              size="lg" 
              onClick={bowl} 
              disabled={isGameOver}
              className="h-20 text-2xl font-headline font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl group relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                BOWL NEXT BALL
              </div>
              <span className="absolute bottom-2 right-4 text-[10px] uppercase tracking-tighter opacity-50 hidden md:block">Space</span>
            </Button>
            <Button 
              size="lg" 
              onClick={simulateOver}
              disabled={isGameOver}
              variant="secondary"
              className="h-20 text-xl font-headline font-bold rounded-2xl border border-white/5 hover:bg-secondary/80"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6" />
                SIMULATE OVER
              </div>
            </Button>
          </div>

          <Card className="bg-white/5 border-white/5 overflow-hidden">
            <CardHeader className="py-4 px-6 flex flex-row items-center justify-between border-b border-white/5">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Recent Deliveries</CardTitle>
              <div className="text-xs font-mono text-primary/60">{history.length} balls</div>
            </CardHeader>
            <CardContent className="p-4 flex gap-3 overflow-x-auto no-scrollbar">
              {history.length > 0 ? history.map((h, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border transition-all duration-300",
                    h.isWicket ? "bg-destructive/20 border-destructive text-destructive" :
                    h.isBoundary ? "bg-accent/20 border-accent text-accent" :
                    "bg-white/5 border-white/10 text-white"
                  )}
                >
                  {h.value}
                </div>
              )) : (
                <div className="text-muted-foreground/30 text-xs py-2 italic">Waiting for action...</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-white/5 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-widest text-primary">{matchFormat} Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-baseline">
                <div className="text-6xl font-headline font-black tracking-tighter animate-number-pop">
                  {score}<span className="text-3xl text-muted-foreground mx-1">/</span><span className={wickets > 7 ? "text-destructive" : "text-white"}>{wickets}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">Overs</p>
                  <p className="text-xl font-headline font-bold">
                    {overs}.{ballsInOver}
                    {matchFormat !== 'TEST' && <span className="text-xs text-muted-foreground ml-1">/ {currentConfig.maxOvers}</span>}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">Extras</p>
                  <p className="text-xl font-headline font-bold">{extras}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">Boundaries</p>
                  <p className="text-xl font-headline font-bold">{boundaries}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">Strike Rate</p>
                  <p className="text-xl font-headline font-bold">{strikeRate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/5">
            <CardHeader className="py-4">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Info className="w-3 h-3" />
                Format Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Aggression Level</span>
                  <span className={cn(
                    "font-mono",
                    matchFormat === 'T20' ? "text-primary" : matchFormat === 'ODI' ? "text-accent" : "text-muted-foreground"
                  )}>
                    {matchFormat === 'T20' ? 'Extreme' : matchFormat === 'ODI' ? 'High' : 'Low'}
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/40" style={{ width: matchFormat === 'T20' ? '90%' : matchFormat === 'ODI' ? '60%' : '20%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Wicket Danger</span>
                  <span className="font-mono text-destructive">{displayWicketWeight}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-destructive/40" style={{ width: `${displayWicketWeight * 5}%` }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-primary font-bold uppercase tracking-widest">Batter Strategy</p>
              <h4 className="font-headline font-bold text-lg">
                {matchFormat === 'T20' ? 'Power Hitting' : matchFormat === 'ODI' ? 'Steady Builder' : 'Defense Mode'}
              </h4>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-12 pb-8 w-full max-w-5xl text-center text-muted-foreground text-xs uppercase tracking-[0.3em]">
        <p>&copy; 2024 PitchPulse Studio &bull; Pro Cricket Simulation Engine</p>
      </footer>
    </div>
  );
}