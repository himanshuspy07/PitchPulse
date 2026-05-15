"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Trophy, 
  Settings, 
  RotateCcw, 
  Play, 
  Zap, 
  Activity,
  Target,
  Shield,
  Flame,
  History,
  Info,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  generateBallResult, 
  BallResult, 
  MatchFormat,
  MATCH_FORMAT_CONFIGS,
  BattingStrategy
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";

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
  const [ballsPerOver, setBallsPerOver] = useState(6);
  const [strategy, setStrategy] = useState<BattingStrategy>('BALANCED');
  const [weights, setWeights] = useState<{ wicket: number | null, extra: number | null }>({
    wicket: null,
    extra: null
  });

  const pitchImage = (PlaceHolderImages && PlaceHolderImages.length > 0) 
    ? (PlaceHolderImages.find(img => img.id === 'cricket-pitch') || PlaceHolderImages[0])
    : null;

  const bowl = useCallback(() => {
    if (isGameOver) return;

    const result = generateBallResult(matchFormat, isFreeHit, {
      wicketWeight: weights.wicket,
      extraWeight: weights.extra,
      strategy: strategy
    });
    
    setLastResult(result);
    setHistory((prev) => [result, ...prev].slice(0, 50));
    setScore((prev) => prev + result.runs);
    
    if (result.isWicket) {
      setWickets((prev) => prev + 1);
      setIsWicketFlash(true);
      setTimeout(() => setIsWicketFlash(false), 1000);
      if (wickets + 1 >= 10) setIsGameOver(true);
    }
    
    if (result.type === 'EXTRA') setExtras((prev) => prev + result.runs);
    
    if (result.isLegal) {
      setBalls((prev) => prev + 1);
      const currentOvers = Math.floor((balls + 1) / 6);
      if (matchFormat !== 'TEST' && currentOvers >= MATCH_FORMAT_CONFIGS[matchFormat].maxOvers) {
        setIsGameOver(true);
      }
    }

    setIsFreeHit(result.value === 'NB');
  }, [isFreeHit, weights, isGameOver, wickets, matchFormat, balls, strategy]);

  const simulateOver = useCallback(() => {
    if (isGameOver) return;
    let b = 0;
    const interval = setInterval(() => {
      if (b < ballsPerOver && !isGameOver) {
        bowl();
        b++;
      } else {
        clearInterval(interval);
      }
    }, 200);
  }, [bowl, isGameOver, ballsPerOver]);

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

  const overs = `${Math.floor(balls / 6)}.${balls % 6}`;
  const boundaries = history.filter(h => h.isBoundary).length;
  const currentConfig = MATCH_FORMAT_CONFIGS[matchFormat];

  return (
    <div className="min-h-screen flex flex-col items-center selection:bg-primary selection:text-white pb-12">
      {/* Wicket Flash Overlay */}
      {isWicketFlash && (
        <div className="fixed inset-0 z-50 bg-destructive/30 backdrop-blur-sm wicket-overlay pointer-events-none flex items-center justify-center">
          <h2 className="text-8xl font-headline font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">OUT!</h2>
        </div>
      )}

      {/* Header */}
      <header className="w-full max-w-6xl px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 bg-card/30 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-headline font-black tracking-tight leading-none">PITCH<span className="text-primary">PULSE</span></h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Simulator Pro</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={matchFormat} onValueChange={(v) => { setMatchFormat(v as MatchFormat); resetGame(); }}>
            <SelectTrigger className="w-32 h-9 rounded-lg bg-secondary border-none text-xs font-bold uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="T20">T20 International</SelectItem>
              <SelectItem value="ODI">One Day Intl</SelectItem>
              <SelectItem value="TEST">Test Match</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="ghost" size="icon" onClick={resetGame} className="h-9 w-9 rounded-lg hover:bg-secondary">
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-secondary">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Simulation Settings</DialogTitle></DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><Label>Wicket Chance</Label><span className="font-mono text-primary">{(weights.wicket ?? currentConfig.wicketWeight).toFixed(1)}%</span></div>
                  <Slider value={[weights.wicket ?? currentConfig.wicketWeight]} onValueChange={v => setWeights(p => ({...p, wicket: v[0]}))} max={20} step={0.1} />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><Label>Extras Chance</Label><span className="font-mono text-primary">{(weights.extra ?? currentConfig.extraWeight).toFixed(1)}%</span></div>
                  <Slider value={[weights.extra ?? currentConfig.extraWeight]} onValueChange={v => setWeights(p => ({...p, extra: v[0]}))} max={20} step={0.1} />
                </div>
                <Button variant="outline" className="w-full text-xs" onClick={() => setWeights({ wicket: null, extra: null })}>Reset to Format Defaults</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="w-full max-w-6xl px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Game View & Controls */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Display Card */}
          <Card className="glass-card overflow-hidden relative aspect-video flex items-center justify-center border-none shadow-2xl">
            {pitchImage && (
              <div className="absolute inset-0 z-0 opacity-10">
                <Image src={pitchImage.imageUrl} alt="Pitch" fill className="object-cover" />
              </div>
            )}
            
            <div className="relative z-10 text-center space-y-4">
              {lastResult ? (
                <div className="animate-score-pop">
                  <h2 className={cn(
                    "text-[10rem] font-headline font-black leading-none italic tracking-tighter drop-shadow-2xl",
                    lastResult.isWicket ? "text-destructive" : lastResult.isBoundary ? "text-accent" : "text-emerald-400"
                  )}>
                    {lastResult.value}
                  </h2>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="bg-background/50 backdrop-blur-md uppercase tracking-[0.2em] font-bold py-1 px-4">
                      {lastResult.isWicket ? lastResult.wicketType : lastResult.extraType || (lastResult.isBoundary ? "Spectacular Shot" : "Fair Delivery")}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 opacity-20">
                  <Play className="w-24 h-24" />
                  <p className="font-headline font-black text-3xl uppercase italic tracking-tighter">Awaiting Delivery</p>
                </div>
              )}
            </div>

            {isFreeHit && (
              <div className="absolute top-6 right-6 z-20 bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-xl text-sm font-black italic uppercase tracking-tighter animate-pulse flex items-center gap-2">
                <Zap className="w-4 h-4 fill-primary" /> Free Hit
              </div>
            )}

            {isGameOver && (
              <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
                <Trophy className="w-20 h-20 text-accent mb-6 drop-shadow-lg" />
                <h3 className="text-5xl font-headline font-black italic uppercase tracking-tighter mb-2">Innings Closed</h3>
                <div className="text-7xl font-headline font-black text-primary mb-6 italic">{score}/{wickets}</div>
                <p className="text-muted-foreground mb-8 max-w-md font-medium">Final Score after {overs} overs. {wickets >= 10 ? "The team is all out." : "Maximum overs completed."}</p>
                <Button onClick={resetGame} size="lg" className="h-16 px-12 text-xl font-headline font-black italic rounded-2xl shadow-xl shadow-primary/20">NEW INNINGS</Button>
              </div>
            )}
          </Card>

          {/* Action Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card p-6 border-none shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2">
                  <Target className="w-3 h-3" /> Batter Intent
                </Label>
                <span className="text-[10px] font-bold text-primary uppercase">{strategy}</span>
              </div>
              <Tabs value={strategy} onValueChange={v => setStrategy(v as BattingStrategy)}>
                <TabsList className="grid grid-cols-3 h-12 bg-background p-1 rounded-xl">
                  <TabsTrigger value="DEFENSIVE" className="rounded-lg data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                    <Shield className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Defend</span>
                  </TabsTrigger>
                  <TabsTrigger value="BALANCED" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Play className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Auto</span>
                  </TabsTrigger>
                  <TabsTrigger value="AGGRESSIVE" className="rounded-lg data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
                    <Flame className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Attack</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </Card>

            <Card className="glass-card p-6 border-none shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Over Length
                </Label>
                <span className="text-[10px] font-bold text-accent uppercase">{ballsPerOver} Balls</span>
              </div>
              <div className="pt-2">
                <Slider value={[ballsPerOver]} onValueChange={v => setBallsPerOver(v[0])} min={1} max={12} step={1} className="[&>span]:bg-accent" />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              size="lg" 
              onClick={bowl} 
              disabled={isGameOver}
              className="md:col-span-2 h-20 text-3xl font-headline font-black italic tracking-tighter rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              BOWL NOW
              <span className="ml-4 opacity-30 text-xs not-italic font-sans uppercase hidden md:block">Press Space</span>
            </Button>
            <Button 
              size="lg" 
              onClick={simulateOver} 
              disabled={isGameOver}
              variant="secondary"
              className="h-20 text-lg font-headline font-black italic tracking-tighter rounded-2xl bg-secondary hover:bg-secondary/80 border border-white/5"
            >
              SIM OVER
            </Button>
          </div>

        </div>

        {/* Right Column: Stats & History */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Scoreboard Card */}
          <Card className="bg-primary p-6 border-none shadow-2xl rounded-[2rem] text-white relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Score</p>
                  <div className="text-7xl font-headline font-black italic leading-none animate-score-pop">
                    {score}<span className="text-3xl opacity-40 mx-2 italic">/</span>{wickets}
                  </div>
                </div>
                <Badge className="bg-black/20 text-white border-none text-[10px] py-1 px-3 rounded-full">{matchFormat}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Overs</p>
                  <p className="text-2xl font-headline font-black italic">{overs}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Boundaries</p>
                  <p className="text-2xl font-headline font-black italic text-accent">{boundaries}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Extras</p>
                  <p className="text-2xl font-headline font-black italic">{extras}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Run Rate</p>
                  <p className="text-2xl font-headline font-black italic">{(balls > 0 ? (score / (balls / 6)).toFixed(2) : "0.00")}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Deliveries */}
          <Card className="glass-card p-6 border-none shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History className="w-3 h-3" /> Recent History
              </h4>
              <Badge variant="secondary" className="text-[9px] font-bold">{history.length} Balls</Badge>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {history.length > 0 ? history.map((h, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                    h.isWicket ? "bg-destructive text-white scale-110 shadow-lg shadow-destructive/20" :
                    h.isBoundary ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" :
                    h.value === '0' ? "bg-muted text-muted-foreground" :
                    "bg-secondary text-white border border-white/5"
                  )}
                >
                  {h.value}
                </div>
              )) : (
                <div className="w-full text-center py-8 opacity-20 flex flex-col items-center gap-2">
                  <Info className="w-6 h-6" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">No Action Yet</p>
                </div>
              )}
            </div>
            
            {history.length > 0 && (
              <Button variant="ghost" className="w-full mt-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white" onClick={() => setHistory([])}>
                Clear Session
              </Button>
            )}
          </Card>

          {/* Strategy Insight */}
          <Card className="glass-card p-6 border-none shadow-xl border-l-4 border-accent">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-widest mb-1">Tactical Update</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {strategy === 'AGGRESSIVE' ? "Aggression levels high. Expect big boundaries but be wary of the increased risk of mistimed shots." : 
                   strategy === 'DEFENSIVE' ? "Playing for time. Defensive stance will lower scoring rate but significantly preserve your wickets." : 
                   "Balanced approach. Searching for gaps and taking singles while keeping the scoreboard moving steadily."}
                </p>
                <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-accent uppercase group cursor-pointer">
                  Learn More <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Card>

        </div>
      </main>

      <footer className="mt-20 text-center space-y-2 px-4">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
          Engineered for PitchPulse Studio &bull; v2.0 Redesign
        </div>
        <div className="flex justify-center gap-6 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">
          <span>Terms</span>
          <span>Privacy</span>
          <span>Sim Logic</span>
        </div>
      </footer>
    </div>
  );
}