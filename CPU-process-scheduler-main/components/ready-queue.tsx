"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, CheckCircle, AlertCircle } from "lucide-react"
import type { SchedulingResult, Process } from "@/lib/scheduling-algorithms"

interface ReadyQueueProps {
  result: SchedulingResult | null
  currentTime: number
  algorithm: string
}

interface ProcessState {
  process: Process
  state: "waiting" | "executing" | "completed" | "not-arrived"
  remainingTime?: number
  waitingTime?: number
}

export function ReadyQueue({ result, currentTime, algorithm }: ReadyQueueProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ready Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Run an algorithm to see the process states
          </div>
        </CardContent>
      </Card>
    )
  }

  const getProcessStates = (): ProcessState[] => {
    return result.processes.map((process) => {
      // Check if process has arrived
      if (currentTime < process.arrivalTime) {
        return {
          process,
          state: "not-arrived",
        }
      }

      // Check if process is completed
      if (process.completionTime && currentTime >= process.completionTime) {
        return {
          process,
          state: "completed",
        }
      }

      // Check if process is currently executing
      const currentExecution = result.ganttChart.find(
        (item) => item.processId === process.id && item.startTime <= currentTime && currentTime < item.endTime,
      )

      if (currentExecution) {
        const remainingTime = currentExecution.endTime - currentTime
        return {
          process,
          state: "executing",
          remainingTime,
        }
      }

      // Process is waiting
      const waitingTime = currentTime - process.arrivalTime
      return {
        process,
        state: "waiting",
        waitingTime,
      }
    })
  }

  const processStates = getProcessStates()
  const waitingProcesses = processStates.filter((ps) => ps.state === "waiting")
  const executingProcesses = processStates.filter((ps) => ps.state === "executing")
  const completedProcesses = processStates.filter((ps) => ps.state === "completed")
  const notArrivedProcesses = processStates.filter((ps) => ps.state === "not-arrived")

  const getStateIcon = (state: string) => {
    switch (state) {
      case "waiting":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "executing":
        return <Play className="h-4 w-4 text-green-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "not-arrived":
        return <AlertCircle className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  const getStateBadge = (state: string) => {
    switch (state) {
      case "waiting":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Waiting
          </Badge>
        )
      case "executing":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Executing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Completed
          </Badge>
        )
      case "not-arrived":
        return (
          <Badge variant="outline" className="text-gray-500">
            Not Arrived
          </Badge>
        )
      default:
        return null
    }
  }

  const ProcessCard = ({ processState }: { processState: ProcessState }) => {
    const { process, state, remainingTime, waitingTime } = processState

    return (
      <div className="p-3 border rounded-lg space-y-2 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStateIcon(state)}
            <span className="font-semibold">{process.id}</span>
          </div>
          {getStateBadge(state)}
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <div>Arrival: {process.arrivalTime}ms</div>
          <div>Burst: {process.burstTime}ms</div>
          {process.priority !== undefined && <div>Priority: {process.priority}</div>}

          {state === "executing" && remainingTime !== undefined && (
            <div className="text-green-600 font-medium">Remaining: {remainingTime.toFixed(1)}ms</div>
          )}

          {state === "waiting" && waitingTime !== undefined && (
            <div className="text-yellow-600 font-medium">Waiting: {waitingTime.toFixed(1)}ms</div>
          )}

          {state === "completed" && process.completionTime && (
            <div className="text-blue-600 font-medium">Completed at: {process.completionTime}ms</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ready Queue</span>
            <Badge variant="outline">Time: {currentTime.toFixed(1)}ms</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Queue Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-2 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{waitingProcesses.length}</div>
              <div className="text-xs text-yellow-700">Waiting</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{executingProcesses.length}</div>
              <div className="text-xs text-green-700">Executing</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{completedProcesses.length}</div>
              <div className="text-xs text-blue-700">Completed</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{notArrivedProcesses.length}</div>
              <div className="text-xs text-gray-700">Not Arrived</div>
            </div>
          </div>

          {/* Currently Executing */}
          {executingProcesses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-green-600 flex items-center gap-2">
                <Play className="h-4 w-4" />
                Currently Executing
              </h4>
              <div className="grid gap-2">
                {executingProcesses.map((ps, index) => (
                  <ProcessCard key={index} processState={ps} />
                ))}
              </div>
            </div>
          )}

          {/* Waiting Queue */}
          {waitingProcesses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Waiting Queue ({waitingProcesses.length})
              </h4>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {waitingProcesses.map((ps, index) => (
                  <ProcessCard key={index} processState={ps} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Process Status Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Completed Processes */}
          {completedProcesses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed Processes ({completedProcesses.length})
              </h4>
              <div className="grid gap-2 max-h-32 overflow-y-auto">
                {completedProcesses.map((ps, index) => (
                  <ProcessCard key={index} processState={ps} />
                ))}
              </div>
            </div>
          )}

          {/* Not Yet Arrived */}
          {notArrivedProcesses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Not Yet Arrived ({notArrivedProcesses.length})
              </h4>
              <div className="grid gap-2 max-h-32 overflow-y-auto">
                {notArrivedProcesses.map((ps, index) => (
                  <ProcessCard key={index} processState={ps} />
                ))}
              </div>
            </div>
          )}

          {/* Algorithm Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Algorithm: {algorithm.toUpperCase()}</h4>
            <div className="text-sm text-muted-foreground">
              {algorithm === "fcfs" && "Processes are executed in order of arrival time."}
              {algorithm === "sjf" && "Shortest job is selected next (non-preemptive)."}
              {algorithm === "srtf" && "Process with shortest remaining time is executed (preemptive)."}
              {algorithm === "rr" && "Each process gets a fixed time quantum in round-robin fashion."}
              {algorithm === "priority" && "Processes are scheduled based on priority values."}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
