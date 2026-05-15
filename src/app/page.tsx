
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
  ChevronRight,
  TrendingUp,
  Dices,
  Hash
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
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground pb-12 transition-colors duration-500">
      {/* Wicket Flash Overlay */}
      {isWicketFlash && (
        <div className="fixed inset-0 z-50 bg-destructive/40 backdrop-blur-md wicket-overlay pointer-events-none flex items-center justify-center">
          <h2 className="text-6xl md:text-9xl font-headline font-black text-white italic tracking-tighter uppercase drop-shadow-2xl animate-in zoom-in duration-300">OUT!</h2>
        </div>
      )}

      {/* Header */}
      <header className="w-full max-w-7xl px-4 md:px-6 py-4 md:py-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 bg-card/50 backdrop-blur-2xl sticky top-0 z-40">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
            <Flame className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-headline font-black tracking-tight leading-none">PITCH<span className="text-primary">PULSE</span></h1>
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">Simulator Pro</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <Select value={matchFormat} onValueChange={(v) => { setMatchFormat(v as MatchFormat); resetGame(); }}>
            <SelectTrigger className="w-32 md:w-40 h-9 md:h-10 rounded-lg bg-secondary border-none text-[10px] md:text-xs font-bold uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="T20">T20 International</SelectItem>
              <SelectItem value="ODI">One Day Intl</SelectItem>
              <SelectItem value="TEST">Test Match</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="icon" onClick={resetGame} className="h-9 w-9 md:h-10 md:w-10 rounded-lg hover:bg-secondary transition-all">
              <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-lg hover:bg-secondary transition-all">
                  <Settings className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/5">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Simulation Parameters
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <Label className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-destructive" /> Wicket Probability
                      </Label>
                      <span className="font-mono text-primary font-bold">{(weights.wicket ?? currentConfig.wicketWeight).toFixed(1)}%</span>
                    </div>
                    <Slider value={[weights.wicket ?? currentConfig.wicketWeight]} onValueChange={v => setWeights(p => ({...p, wicket: v[0]}))} max={20} step={0.1} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <Label className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-accent" /> Extras Frequency
                      </Label>
                      <span className="font-mono text-primary font-bold">{(weights.extra ?? currentConfig.extraWeight).toFixed(1)}%</span>
                    </div>
                    <Slider value={[weights.extra ?? currentConfig.extraWeight]} onValueChange={v => setWeights(p => ({...p, extra: v[0]}))} max={20} step={0.1} />
                  </div>
                  <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-widest border-white/10 hover:bg-white/5" onClick={() => setWeights({ wicket: null, extra: null })}>
                    Restore Format Defaults
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl px-4 md:px-6 mt-6 md:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Game View & Controls */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8 w-full">
          
          {/* Main Display Card */}
          <Card className="glass-card overflow-hidden relative aspect-video flex items-center justify-center border-none shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem]">
            {pitchImage && (
              <div className="absolute inset-0 z-0 opacity-15 grayscale hover:grayscale-0 transition-all duration-1000">
                <Image src={pitchImage.imageUrl} alt="Pitch" fill className="object-cover" priority />
              </div>
            )}
            
            <div className="relative z-10 text-center space-y-4 px-4">
              {lastResult ? (
                <div className="animate-score-pop">
                  <h2 className={cn(
                    "text-8xl sm:text-[10rem] md:text-[12rem] font-headline font-black leading-none italic tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
                    lastResult.isWicket ? "text-destructive" : lastResult.isBoundary ? "text-accent" : "text-emerald-400"
                  )}>
                    {lastResult.value}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Badge variant="outline" className="bg-black/60 backdrop-blur-md uppercase tracking-[0.2em] font-black py-1.5 md:py-2 px-4 md:px-6 text-[10px] md:text-xs border-white/10">
                      {lastResult.isWicket ? lastResult.wicketType : lastResult.extraType || (lastResult.isBoundary ? "Massive Strike" : "Standard Delivery")}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 md:gap-8 opacity-20">
                  <Play className="w-20 h-20 md:w-32 md:h-32 text-primary" />
                  <p className="font-headline font-black text-2xl md:text-4xl uppercase italic tracking-tighter">Ready for Delivery</p>
                </div>
              )}
            </div>

            {isFreeHit && (
              <div className="absolute top-4 md:top-8 right-4 md:right-8 z-20 bg-primary/20 text-primary border border-primary/30 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black italic uppercase tracking-tighter animate-pulse flex items-center gap-2 shadow-lg shadow-primary/20">
                <Zap className="w-3 h-3 md:w-5 md:h-5 fill-primary" /> Free Hit
              </div>
            )}

            {isGameOver && (
              <div className="absolute inset-0 z-30 bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12 text-center animate-in fade-in zoom-in duration-700">
                <Trophy className="w-16 h-16 md:w-24 md:h-24 text-accent mb-6 drop-shadow-[0_0_20px_rgba(255,191,0,0.3)] animate-bounce" />
                <h3 className="text-4xl md:text-7xl font-headline font-black italic uppercase tracking-tighter mb-2">Innings Over</h3>
                <div className="text-6xl md:text-9xl font-headline font-black text-primary mb-6 italic drop-shadow-2xl">
                  {score}<span className="text-3xl md:text-5xl opacity-30 mx-2 italic">/</span>{wickets}
                </div>
                <p className="text-muted-foreground mb-8 max-w-md font-medium text-sm md:text-lg">Final Score achieved in {overs} overs. {wickets >= 10 ? "The batting side is all out." : "Targeted overs concluded."}</p>
                <Button onClick={resetGame} size="lg" className="h-16 md:h-20 px-10 md:px-16 text-lg md:text-2xl font-headline font-black italic rounded-2xl md:rounded-3xl shadow-2xl shadow-primary/30 hover:scale-105 transition-transform active:scale-95">
                  START NEW INNINGS
                </Button>
              </div>
            )}
          </Card>

          {/* Action Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="glass-card p-5 md:p-8 border-none shadow-xl rounded-2xl md:rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <Label className="text-[10px] md:text-xs uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" /> Batting Strategy
                </Label>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] font-black">{strategy}</Badge>
              </div>
              <Tabs value={strategy} onValueChange={v => setStrategy(v as BattingStrategy)}>
                <TabsList className="grid grid-cols-3 h-14 bg-background/50 p-1.5 rounded-2xl border border-white/5">
                  <TabsTrigger value="DEFENSIVE" className="rounded-xl data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                    <Shield className="w-4 h-4 md:mr-2" /> <span className="hidden sm:inline">Defend</span>
                  </TabsTrigger>
                  <TabsTrigger value="BALANCED" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Play className="w-4 h-4 md:mr-2" /> <span className="hidden sm:inline">Normal</span>
                  </TabsTrigger>
                  <TabsTrigger value="AGGRESSIVE" className="rounded-xl data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
                    <Flame className="w-4 h-4 md:mr-2" /> <span className="hidden sm:inline">Attack</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </Card>

            <Card className="glass-card p-5 md:p-8 border-none shadow-xl rounded-2xl md:rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <Label className="text-[10px] md:text-xs uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Simulate Over
                </Label>
                <Badge variant="secondary" className="bg-accent/10 text-accent border-none text-[9px] font-black">{ballsPerOver} Deliveries</Badge>
              </div>
              <div className="pt-2 px-2">
                <Slider value={[ballsPerOver]} onValueChange={v => setBallsPerOver(v[0])} min={1} max={12} step={1} className="[&>span]:bg-accent" />
                <div className="flex justify-between mt-3 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                  <span>1 Ball</span>
                  <span>12 Balls</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <Button 
              size="lg" 
              onClick={bowl} 
              disabled={isGameOver}
              className="sm:col-span-2 h-20 md:h-24 text-3xl md:text-5xl font-headline font-black italic tracking-tighter rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl shadow-primary/40 transition-all hover:scale-[1.03] active:scale-[0.97] relative overflow-hidden group"
            >
              <span className="relative z-10">BOWL NOW</span>
              <Play className="absolute right-6 opacity-10 w-24 h-24 rotate-12 group-hover:scale-125 transition-transform" />
              <span className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] not-italic font-sans uppercase tracking-[0.3em] opacity-30">Press Space</span>
            </Button>
            <Button 
              size="lg" 
              onClick={simulateOver} 
              disabled={isGameOver}
              variant="secondary"
              className="h-20 md:h-24 text-xl md:text-2xl font-headline font-black italic tracking-tighter rounded-[1.5rem] md:rounded-[2.5rem] bg-secondary hover:bg-secondary/80 border border-white/5 shadow-xl transition-all"
            >
              <Dices className="mr-3 w-6 h-6 md:w-8 md:h-8" />
              SIM OVER
            </Button>
          </div>

        </div>

        {/* Right Column: Stats & History */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8 w-full">
          
          {/* Scoreboard Card */}
          <Card className="bg-primary p-6 md:p-8 border-none shadow-2xl rounded-[2rem] md:rounded-[3rem] text-white relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="relative z-10 flex flex-col gap-6 md:gap-8">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-60 mb-2">Innings Score</p>
                  <div className="text-6xl md:text-8xl font-headline font-black italic leading-none animate-score-pop drop-shadow-lg">
                    {score}<span className="text-2xl md:text-4xl opacity-30 mx-2 italic">/</span>{wickets}
                  </div>
                </div>
                <Badge className="bg-black/20 text-white border-white/10 text-[9px] md:text-[11px] font-black py-1.5 px-4 rounded-full backdrop-blur-md uppercase tracking-widest">{matchFormat}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white/10 p-4 md:p-5 rounded-2xl md:rounded-[2rem] backdrop-blur-sm border border-white/5">
                  <p className="text-[9px] md:text-[11px] font-black uppercase tracking-widest opacity-50 mb-2 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Overs
                  </p>
                  <p className="text-2xl md:text-3xl font-headline font-black italic">{overs}</p>
                </div>
                <div className="bg-white/10 p-4 md:p-5 rounded-2xl md:rounded-[2rem] backdrop-blur-sm border border-white/5">
                  <p className="text-[9px] md:text-[11px] font-black uppercase tracking-widest opacity-50 mb-2 flex items-center gap-2 text-accent">
                    <Zap className="w-3 h-3" /> Fours/Sixes
                  </p>
                  <p className="text-2xl md:text-3xl font-headline font-black italic text-accent">{boundaries}</p>
                </div>
                <div className="bg-white/10 p-4 md:p-5 rounded-2xl md:rounded-[2rem] backdrop-blur-sm border border-white/5">
                  <p className="text-[9px] md:text-[11px] font-black uppercase tracking-widest opacity-50 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" /> Extras
                  </p>
                  <p className="text-2xl md:text-3xl font-headline font-black italic">{extras}</p>
                </div>
                <div className="bg-white/10 p-4 md:p-5 rounded-2xl md:rounded-[2rem] backdrop-blur-sm border border-white/5">
                  <p className="text-[9px] md:text-[11px] font-black uppercase tracking-widest opacity-50 mb-2 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Run Rate
                  </p>
                  <p className="text-2xl md:text-3xl font-headline font-black italic">{(balls > 0 ? (score / (balls / 6)).toFixed(2) : "0.00")}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Deliveries */}
          <Card className="glass-card p-6 md:p-8 border-none shadow-xl rounded-2xl md:rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-3">
                <History className="w-4 h-4 text-primary" /> Delivery Stream
              </h4>
              <Badge variant="secondary" className="text-[10px] font-black rounded-lg px-3">{history.length} Balls</Badge>
            </div>
            
            <div className="flex flex-wrap gap-2.5 md:gap-3">
              {history.length > 0 ? history.map((h, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-[11px] md:text-sm font-black transition-all hover:scale-110 cursor-default",
                    h.isWicket ? "bg-destructive text-white shadow-lg shadow-destructive/20 border-b-4 border-destructive-foreground/30" :
                    h.isBoundary ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20 border-b-4 border-accent-foreground/30" :
                    h.value === '0' ? "bg-muted text-muted-foreground border border-white/5" :
                    "bg-secondary text-white border border-white/5 shadow-md"
                  )}
                >
                  {h.value}
                </div>
              )) : (
                <div className="w-full text-center py-12 md:py-16 opacity-10 flex flex-col items-center gap-4">
                  <Info className="w-10 h-10 md:w-16 md:h-16" />
                  <p className="text-[10px] md:text-xs uppercase font-black tracking-widest">Waiting for First Bowl</p>
                </div>
              )}
            </div>
            
            {history.length > 0 && (
              <Button variant="ghost" className="w-full mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all" onClick={() => setHistory([])}>
                Clear Feed
              </Button>
            )}
          </Card>

          {/* Strategy Insight */}
          <Card className="glass-card p-6 md:p-8 border-none shadow-xl border-l-[6px] md:border-l-[8px] border-accent rounded-2xl md:rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
              <Flame className="w-24 h-24 rotate-12" />
            </div>
            <div className="flex gap-4 md:gap-6 items-start relative z-10">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
                <Flame className="w-6 h-6 md:w-7 md:h-7 text-accent" />
              </div>
              <div className="space-y-2 md:space-y-3">
                <h5 className="text-[11px] md:text-xs font-black uppercase tracking-widest mb-1">Strategy Brief</h5>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                  {strategy === 'AGGRESSIVE' ? "Aggression set to maximum. Boundary probability spiked by 80%. Defensive vulnerability increased." : 
                   strategy === 'DEFENSIVE' ? "Prioritizing wicket preservation. Boundary risk minimized. Scoring rate expected to decline." : 
                   "Balanced rotational play. Finding gaps and keeping the scorecard ticking over with high consistency."}
                </p>
                <div className="pt-2 flex items-center gap-1 text-[10px] font-black text-accent uppercase group cursor-pointer hover:text-accent/80 transition-colors">
                  Match Analysis <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Card>

        </div>
      </main>

      <footer className="mt-20 md:mt-32 text-center space-y-4 px-6 border-t border-white/5 pt-12 w-full max-w-7xl">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 opacity-40">
           <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
            Engineered for PitchPulse Pro &bull; v2.5 Redesign
          </div>
          <div className="hidden md:block h-4 w-px bg-white/10" />
          <div className="flex justify-center gap-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <span className="hover:text-primary cursor-pointer transition-colors">Documentation</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Sim Engine</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
          </div>
        </div>
        <p className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-[0.5em]">Global Simulator Infrastructure &bull; Active</p>
      </footer>
    </div>
  );
}
