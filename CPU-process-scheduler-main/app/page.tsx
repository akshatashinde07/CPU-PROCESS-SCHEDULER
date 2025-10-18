"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Trash2, AlertCircle, Sparkles } from "lucide-react"
import { GanttChart } from "@/components/gantt-chart"
import { ReadyQueue } from "@/components/ready-queue"
import { MetricsDashboard } from "@/components/metrics-dashboard"
import { ExportControls } from "@/components/export-controls"
import type { Process, SchedulingResult } from "@/lib/scheduling-algorithms"
import {
  fcfsScheduling,
  sjfScheduling,
  srtfScheduling,
  roundRobinScheduling,
  priorityScheduling,
} from "@/lib/scheduling-algorithms"

export default function CPUSchedulerPage() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [algorithm, setAlgorithm] = useState<string>("fcfs")
  const [timeQuantum, setTimeQuantum] = useState<number>(2)
  const [isPreemptive, setIsPreemptive] = useState<boolean>(false)
  const [result, setResult] = useState<SchedulingResult | null>(null)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)

  const [errors, setErrors] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string>("")

  // Form state for adding new process
  const [newProcess, setNewProcess] = useState({
    id: "",
    arrivalTime: 0,
    burstTime: 0,
    priority: 0,
  })

  const validateProcess = (process: typeof newProcess): string[] => {
    const errors: string[] = []

    if (!process.id.trim()) {
      errors.push("Process ID is required")
    } else if (processes.some((p) => p.id === process.id.trim())) {
      errors.push("Process ID must be unique")
    }

    if (process.arrivalTime < 0) {
      errors.push("Arrival time cannot be negative")
    }

    if (process.burstTime <= 0) {
      errors.push("Burst time must be greater than 0")
    }

    if (algorithm === "priority" && process.priority <= 0) {
      errors.push("Priority must be greater than 0")
    }

    return errors
  }

  const addProcess = () => {
    const validationErrors = validateProcess(newProcess)

    if (validationErrors.length > 0) {
      setValidationError(validationErrors[0])
      return
    }

    const process: Process = {
      id: newProcess.id.trim(),
      arrivalTime: newProcess.arrivalTime,
      burstTime: newProcess.burstTime,
      priority: algorithm === "priority" ? newProcess.priority : undefined,
    }

    setProcesses([...processes, process])
    setNewProcess({ id: "", arrivalTime: 0, burstTime: 0, priority: 0 })
    setValidationError("")
  }

  const removeProcess = (processId: string) => {
    setProcesses(processes.filter((p) => p.id !== processId))
    setResult(null)
  }

  const loadDemoData = () => {
    const demoProcesses: Process[] = [
      { id: "P1", arrivalTime: 0, burstTime: 8, priority: 3 },
      { id: "P2", arrivalTime: 1, burstTime: 4, priority: 1 },
      { id: "P3", arrivalTime: 2, burstTime: 9, priority: 4 },
      { id: "P4", arrivalTime: 3, burstTime: 5, priority: 2 },
    ]
    setProcesses(demoProcesses)
    setValidationError("")
    setResult(null)
  }

  const generateRandomData = () => {
    const randomProcesses: Process[] = []
    const processCount = Math.floor(Math.random() * 5) + 3 // 3-7 processes

    for (let i = 1; i <= processCount; i++) {
      randomProcesses.push({
        id: `P${i}`,
        arrivalTime: Math.floor(Math.random() * 10),
        burstTime: Math.floor(Math.random() * 15) + 1,
        priority: Math.floor(Math.random() * 5) + 1,
      })
    }

    setProcesses(randomProcesses)
    setValidationError("")
    setResult(null)
  }

  const clearProcesses = () => {
    setProcesses([])
    setResult(null)
    setValidationError("")
  }

  const validateForExecution = (): string[] => {
    const errors: string[] = []

    if (processes.length === 0) {
      errors.push("At least one process is required")
    }

    if (algorithm === "rr" && timeQuantum <= 0) {
      errors.push("Time quantum must be greater than 0 for Round Robin")
    }

    if (algorithm === "priority" && processes.some((p) => p.priority === undefined || p.priority <= 0)) {
      errors.push("All processes must have valid priorities for Priority Scheduling")
    }

    return errors
  }

  const handleAlgorithmChange = (newAlgorithm: string) => {
    setAlgorithm(newAlgorithm)
    setResult(null)
    setValidationError("")

    // Reset priority values if switching away from priority scheduling
    if (newAlgorithm !== "priority") {
      setProcesses(processes.map((p) => ({ ...p, priority: undefined })))
    }
  }

  const runAlgorithm = () => {
    const executionErrors = validateForExecution()
    if (executionErrors.length > 0) {
      setValidationError(executionErrors[0])
      return
    }

    setIsRunning(true)
    setValidationError("")

    let schedulingResult: SchedulingResult

    try {
      switch (algorithm) {
        case "fcfs":
          schedulingResult = fcfsScheduling(processes)
          break
        case "sjf":
          schedulingResult = sjfScheduling(processes)
          break
        case "srtf":
          schedulingResult = srtfScheduling(processes)
          break
        case "rr":
          schedulingResult = roundRobinScheduling(processes, timeQuantum)
          break
        case "priority":
          schedulingResult = priorityScheduling(processes, isPreemptive)
          break
        default:
          throw new Error("Unknown algorithm")
      }

      setResult(schedulingResult)
    } catch (error) {
      setValidationError("Error running algorithm: " + (error as Error).message)
    } finally {
      setIsRunning(false)
    }
  }

  const getAlgorithmDescription = (alg: string) => {
    switch (alg) {
      case "fcfs":
        return "Processes are executed in the order they arrive. Simple but can cause convoy effect."
      case "sjf":
        return "Shortest job is selected next. Optimal for average waiting time but can cause starvation."
      case "srtf":
        return "Preemptive version of SJF. Process with shortest remaining time is executed."
      case "rr":
        return "Each process gets a fixed time quantum. Fair scheduling with good response time."
      case "priority":
        return "Processes are scheduled based on priority. Can be preemptive or non-preemptive."
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              CPU Process Scheduling
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Interactive visualization and analysis of various CPU scheduling algorithms with real-time animation and
            performance metrics
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">FCFS</Badge>
            <Badge variant="outline">SJF</Badge>
            <Badge variant="outline">SRTF</Badge>
            <Badge variant="outline">Round Robin</Badge>
            <Badge variant="outline">Priority</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Process Input Panel */}
          <Card className="lg:col-span-1 shadow-lg border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Add Process</CardTitle>
              <p className="text-sm text-muted-foreground">{getAlgorithmDescription(algorithm)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {validationError && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="processId">Process ID</Label>
                <Input
                  id="processId"
                  value={newProcess.id}
                  onChange={(e) => {
                    setNewProcess({ ...newProcess, id: e.target.value })
                    setValidationError("")
                  }}
                  placeholder="e.g., P1"
                  className={`transition-all ${validationError.includes("Process ID") ? "border-destructive ring-destructive/20" : "focus:ring-primary/20"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival Time</Label>
                  <Input
                    id="arrivalTime"
                    type="number"
                    min="0"
                    value={newProcess.arrivalTime}
                    onChange={(e) => {
                      setNewProcess({ ...newProcess, arrivalTime: Number.parseInt(e.target.value) || 0 })
                      setValidationError("")
                    }}
                    className="focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="burstTime">Burst Time</Label>
                  <Input
                    id="burstTime"
                    type="number"
                    min="1"
                    value={newProcess.burstTime}
                    onChange={(e) => {
                      setNewProcess({ ...newProcess, burstTime: Number.parseInt(e.target.value) || 0 })
                      setValidationError("")
                    }}
                    className={`transition-all ${validationError.includes("Burst time") ? "border-destructive ring-destructive/20" : "focus:ring-primary/20"}`}
                  />
                </div>
              </div>

              {algorithm === "priority" && (
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (lower = higher priority)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    value={newProcess.priority}
                    onChange={(e) => {
                      setNewProcess({ ...newProcess, priority: Number.parseInt(e.target.value) || 1 })
                      setValidationError("")
                    }}
                    className={`transition-all ${validationError.includes("Priority") ? "border-destructive ring-destructive/20" : "focus:ring-primary/20"}`}
                  />
                </div>
              )}

              <Button onClick={addProcess} className="w-full shadow-md hover:shadow-lg transition-all">
                Add Process
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={loadDemoData} className="flex-1 hover:bg-primary/5 bg-transparent">
                  Demo Data
                </Button>
                <Button
                  variant="outline"
                  onClick={generateRandomData}
                  className="flex-1 hover:bg-primary/5 bg-transparent"
                >
                  Random Data
                </Button>
              </div>

              <Button variant="destructive" onClick={clearProcesses} className="w-full">
                Clear All
              </Button>
            </CardContent>
          </Card>

          {/* Algorithm Controls */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl">Algorithm Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scheduling Algorithm</Label>
                  <Select value={algorithm} onValueChange={handleAlgorithmChange}>
                    <SelectTrigger className="focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fcfs">First Come First Serve (FCFS)</SelectItem>
                      <SelectItem value="sjf">Shortest Job First (SJF)</SelectItem>
                      <SelectItem value="srtf">Shortest Remaining Time First (SRTF)</SelectItem>
                      <SelectItem value="rr">Round Robin (RR)</SelectItem>
                      <SelectItem value="priority">Priority Scheduling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {algorithm === "rr" && (
                  <div className="space-y-2">
                    <Label htmlFor="quantum">Time Quantum</Label>
                    <Input
                      id="quantum"
                      type="number"
                      min="1"
                      value={timeQuantum}
                      onChange={(e) => setTimeQuantum(Number.parseInt(e.target.value) || 1)}
                      className="focus:ring-primary/20"
                    />
                  </div>
                )}

                {algorithm === "priority" && (
                  <div className="space-y-2">
                    <Label>Priority Mode</Label>
                    <Select
                      value={isPreemptive ? "preemptive" : "non-preemptive"}
                      onValueChange={(value) => setIsPreemptive(value === "preemptive")}
                    >
                      <SelectTrigger className="focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-preemptive">Non-Preemptive</SelectItem>
                        <SelectItem value="preemptive">Preemptive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={runAlgorithm}
                  disabled={processes.length === 0 || isRunning}
                  className="flex-1 shadow-md hover:shadow-lg transition-all"
                >
                  {isRunning ? "Running..." : "Run Algorithm"}
                </Button>
                <Button variant="outline" disabled={!result} className="hover:bg-primary/5 bg-transparent">
                  Pause
                </Button>
                <Button variant="outline" onClick={() => setResult(null)} className="hover:bg-primary/5">
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process List */}
        {processes.length > 0 && (
          <Card className="shadow-lg border-0 bg-card/50 backdrop-blur animate-in slide-in-from-bottom-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xl">
                <span>Current Processes ({processes.length})</span>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {algorithm.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {processes.map((process, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-xl space-y-2 relative group hover:shadow-md transition-all bg-background/50"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProcess(process.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>

                    <div className="font-semibold text-lg text-primary">{process.id}</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Arrival: {process.arrivalTime}ms</div>
                      <div>Burst: {process.burstTime}ms</div>
                      {process.priority !== undefined && <div>Priority: {process.priority}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <GanttChart
            result={result}
            isRunning={isRunning}
            onPlay={() => setIsRunning(true)}
            onPause={() => setIsRunning(false)}
            onReset={() => setResult(null)}
            onTimeUpdate={setCurrentTime}
          />

          <ReadyQueue result={result} currentTime={currentTime} algorithm={algorithm} />

          <MetricsDashboard result={result} algorithm={algorithm} />

          <ExportControls result={result} algorithm={algorithm} processes={processes} />
        </div>
      </div>
    </div>
  )
}
