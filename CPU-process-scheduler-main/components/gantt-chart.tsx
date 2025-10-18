"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw } from "lucide-react"
import type { SchedulingResult } from "@/lib/scheduling-algorithms"

interface GanttChartProps {
  result: SchedulingResult | null
  isRunning: boolean
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onTimeUpdate?: (time: number) => void
}

export function GanttChart({ result, isRunning, onPlay, onPause, onReset, onTimeUpdate }: GanttChartProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [animationSpeed, setAnimationSpeed] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)

  const maxTime = result ? Math.max(...result.ganttChart.map((item) => item.endTime)) : 0
  const timeScale = maxTime > 0 ? Math.max(800 / maxTime, 20) : 20 // Minimum 20px per time unit

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isAnimating && result && currentTime < maxTime) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1 * animationSpeed
          if (next >= maxTime) {
            setIsAnimating(false)
            return maxTime
          }
          return next
        })
      }, 50)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAnimating, currentTime, maxTime, animationSpeed, result])

  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(currentTime)
    }
  }, [currentTime, onTimeUpdate])

  const handlePlay = () => {
    if (currentTime >= maxTime) {
      setCurrentTime(0)
    }
    setIsAnimating(true)
    onPlay()
  }

  const handlePause = () => {
    setIsAnimating(false)
    onPause()
  }

  const handleReset = () => {
    setCurrentTime(0)
    setIsAnimating(false)
    onReset()
  }

  const getVisibleItems = () => {
    if (!result) return []
    return result.ganttChart.filter((item) => item.startTime <= currentTime)
  }

  const getCurrentlyExecuting = () => {
    if (!result) return null
    return result.ganttChart.find((item) => item.startTime <= currentTime && currentTime < item.endTime)
  }

  if (!result) {
    return (
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">Gantt Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Run an algorithm to see the Gantt Chart visualization
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur animate-in slide-in-from-bottom-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl">
          <span>Gantt Chart</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlay}
              disabled={isAnimating}
              className="hover:bg-primary/5 bg-transparent"
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              disabled={!isAnimating}
              className="hover:bg-primary/5 bg-transparent"
            >
              <Pause className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="hover:bg-primary/5 bg-transparent">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Animation Speed Control */}
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium">Speed:</span>
          <div className="flex-1 max-w-48">
            <Slider
              value={[animationSpeed]}
              onValueChange={(value) => setAnimationSpeed(value[0])}
              min={0.5}
              max={3}
              step={0.5}
              className="w-full"
            />
          </div>
          <span className="text-sm text-muted-foreground font-mono">{animationSpeed}x</span>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="flex items-center mb-4 p-3 bg-primary/5 rounded-lg">
            <span className="text-sm font-medium mr-4">Current Time:</span>
            <span className="text-lg font-mono font-bold text-primary">{currentTime.toFixed(1)}ms</span>
            <span className="text-sm text-muted-foreground ml-2">/ {maxTime}ms</span>
          </div>

          {/* Gantt Chart Container */}
          <div className="relative bg-gradient-to-r from-muted/10 to-muted/30 rounded-xl p-6 overflow-x-auto">
            <div className="relative" style={{ width: Math.max(800, maxTime * timeScale) }}>
              {/* Time axis */}
              <div className="flex justify-between mb-6 text-xs text-muted-foreground font-mono">
                {Array.from({ length: Math.ceil(maxTime) + 1 }, (_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-px h-3 bg-border"></div>
                    <span className="mt-1 font-semibold">{i}</span>
                  </div>
                ))}
              </div>

              {/* Process execution blocks */}
              <div className="relative h-20 bg-background rounded-lg border-2 border-border/50 shadow-inner">
                {getVisibleItems().map((item, index) => {
                  const width = Math.min(item.endTime - item.startTime, currentTime - item.startTime) * timeScale
                  const left = item.startTime * timeScale

                  return (
                    <div
                      key={index}
                      className="absolute top-2 h-16 rounded-md flex items-center justify-center text-white text-sm font-bold transition-all duration-100 ease-linear shadow-md"
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                        backgroundColor: item.color,
                        opacity: item.startTime <= currentTime ? 1 : 0.3,
                      }}
                    >
                      {width > 30 && item.processId}
                    </div>
                  )
                })}

                {/* Current time cursor */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-red-500 z-10 transition-all duration-100 ease-linear shadow-lg"
                  style={{ left: `${currentTime * timeScale}px` }}
                >
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
                </div>
              </div>

              {/* Process labels */}
              <div className="mt-4 flex flex-wrap gap-3">
                {result.ganttChart.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm bg-background/80 px-3 py-1 rounded-full">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                    <span className="font-medium">{item.processId}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Currently executing process */}
          {getCurrentlyExecuting() && (
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full animate-pulse shadow-md"
                  style={{ backgroundColor: getCurrentlyExecuting()!.color }}
                ></div>
                <span className="font-semibold text-lg">Currently executing: {getCurrentlyExecuting()!.processId}</span>
                <span className="text-sm text-muted-foreground font-mono bg-background/50 px-2 py-1 rounded">
                  {getCurrentlyExecuting()!.startTime}ms - {getCurrentlyExecuting()!.endTime}ms
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
