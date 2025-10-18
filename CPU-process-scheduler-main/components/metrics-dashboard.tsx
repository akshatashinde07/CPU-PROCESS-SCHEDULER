"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Zap, Cpu, BarChart3, TrendingUp, Timer } from "lucide-react"
import type { SchedulingResult } from "@/lib/scheduling-algorithms"

interface MetricsDashboardProps {
  result: SchedulingResult | null
  algorithm: string
}

export function MetricsDashboard({ result, algorithm }: MetricsDashboardProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Run an algorithm to see performance metrics
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxTime = Math.max(...result.ganttChart.map((item) => item.endTime))
  const totalBurstTime = result.processes.reduce((sum, p) => sum + p.burstTime, 0)

  // Calculate efficiency rating based on metrics
  const getEfficiencyRating = () => {
    const avgWaitingTime = result.averageWaitingTime
    const cpuUtilization = result.cpuUtilization

    // Simple efficiency calculation (can be improved)
    let score = 0
    if (avgWaitingTime <= 2) score += 30
    else if (avgWaitingTime <= 5) score += 20
    else if (avgWaitingTime <= 10) score += 10

    if (cpuUtilization >= 90) score += 30
    else if (cpuUtilization >= 80) score += 25
    else if (cpuUtilization >= 70) score += 20
    else if (cpuUtilization >= 60) score += 15
    else score += 10

    if (result.averageTurnaroundTime <= 10) score += 25
    else if (result.averageTurnaroundTime <= 15) score += 20
    else if (result.averageTurnaroundTime <= 20) score += 15
    else score += 10

    if (result.throughput >= 0.5) score += 15
    else if (result.throughput >= 0.3) score += 10
    else score += 5

    return Math.min(score, 100)
  }

  const efficiencyScore = getEfficiencyRating()

  const getEfficiencyLabel = (score: number) => {
    if (score >= 85) return { label: "Excellent", color: "text-green-600" }
    if (score >= 70) return { label: "Good", color: "text-blue-600" }
    if (score >= 55) return { label: "Fair", color: "text-yellow-600" }
    return { label: "Poor", color: "text-red-600" }
  }

  const efficiency = getEfficiencyLabel(efficiencyScore)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overall Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Avg Waiting Time</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{result.averageWaitingTime.toFixed(2)}ms</div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Avg Turnaround Time</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{result.averageTurnaroundTime.toFixed(2)}ms</div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">CPU Utilization</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{result.cpuUtilization.toFixed(1)}%</div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Throughput</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{result.throughput.toFixed(3)} proc/ms</div>
            </div>
          </div>

          {/* Efficiency Score */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Overall Efficiency</span>
              </div>
              <Badge variant="secondary" className={efficiency.color}>
                {efficiency.label}
              </Badge>
            </div>
            <Progress value={efficiencyScore} className="mb-2" />
            <div className="text-sm text-muted-foreground">
              {efficiencyScore}/100 - Based on waiting time, CPU utilization, and throughput
            </div>
          </div>

          {/* Algorithm Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Algorithm: {algorithm.toUpperCase()}</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Total Execution Time: {maxTime}ms</div>
              <div>Total Burst Time: {totalBurstTime}ms</div>
              <div>Idle Time: {(maxTime - totalBurstTime).toFixed(1)}ms</div>
              <div>Number of Processes: {result.processes.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Process Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Process Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Process Performance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Process</th>
                    <th className="text-right p-2">Arrival</th>
                    <th className="text-right p-2">Burst</th>
                    <th className="text-right p-2">Completion</th>
                    <th className="text-right p-2">Waiting</th>
                    <th className="text-right p-2">Turnaround</th>
                  </tr>
                </thead>
                <tbody>
                  {result.processes.map((process, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{process.id}</td>
                      <td className="p-2 text-right">{process.arrivalTime}</td>
                      <td className="p-2 text-right">{process.burstTime}</td>
                      <td className="p-2 text-right">{process.completionTime}</td>
                      <td className="p-2 text-right">
                        <span
                          className={
                            process.waitingTime! > result.averageWaitingTime ? "text-red-600" : "text-green-600"
                          }
                        >
                          {process.waitingTime?.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <span
                          className={
                            process.turnaroundTime! > result.averageTurnaroundTime ? "text-red-600" : "text-green-600"
                          }
                        >
                          {process.turnaroundTime?.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Performance Comparison */}
            <div className="space-y-3">
              <h4 className="font-medium">Performance Analysis</h4>

              {/* Waiting Time Analysis */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Waiting Time Distribution</span>
                  <span className="text-muted-foreground">vs Average ({result.averageWaitingTime.toFixed(1)}ms)</span>
                </div>
                {result.processes.map((process, index) => {
                  const waitingTime = process.waitingTime || 0
                  const percentage = result.averageWaitingTime > 0 ? (waitingTime / result.averageWaitingTime) * 50 : 0
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs w-8">{process.id}</span>
                      <Progress value={Math.min(percentage, 100)} className="flex-1 h-2" />
                      <span className="text-xs w-12 text-right">{waitingTime.toFixed(1)}ms</span>
                    </div>
                  )
                })}
              </div>

              {/* Best and Worst Performers */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-700 mb-1">Best Performer</div>
                  <div className="text-xs text-green-600">
                    {
                      result.processes.reduce((best, current) =>
                        (current.waitingTime || 0) < (best.waitingTime || 0) ? current : best,
                      ).id
                    }{" "}
                    -{" "}
                    {result.processes
                      .reduce((best, current) =>
                        (current.waitingTime || 0) < (best.waitingTime || 0) ? current : best,
                      )
                      .waitingTime?.toFixed(1)}
                    ms wait
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-sm font-medium text-red-700 mb-1">Needs Attention</div>
                  <div className="text-xs text-red-600">
                    {
                      result.processes.reduce((worst, current) =>
                        (current.waitingTime || 0) > (worst.waitingTime || 0) ? current : worst,
                      ).id
                    }{" "}
                    -{" "}
                    {result.processes
                      .reduce((worst, current) =>
                        (current.waitingTime || 0) > (worst.waitingTime || 0) ? current : worst,
                      )
                      .waitingTime?.toFixed(1)}
                    ms wait
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
