// CPU Process Scheduling Algorithms Implementation

export interface Process {
  id: string
  arrivalTime: number
  burstTime: number
  priority?: number
  remainingTime?: number
  completionTime?: number
  waitingTime?: number
  turnaroundTime?: number
}

export interface GanttChartItem {
  processId: string
  startTime: number
  endTime: number
  color: string
}

export interface SchedulingResult {
  ganttChart: GanttChartItem[]
  processes: Process[]
  averageWaitingTime: number
  averageTurnaroundTime: number
  cpuUtilization: number
  throughput: number
}

// Generate consistent colors for processes
export const generateProcessColor = (processId: string): string => {
  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ]
  const index = Number.parseInt(processId.replace(/\D/g, "")) % colors.length
  return colors[index]
}

// First Come First Serve (FCFS)
export const fcfsScheduling = (processes: Process[]): SchedulingResult => {
  const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime)
  const ganttChart: GanttChartItem[] = []
  let currentTime = 0

  const result = sortedProcesses.map((process) => {
    const startTime = Math.max(currentTime, process.arrivalTime)
    const endTime = startTime + process.burstTime

    ganttChart.push({
      processId: process.id,
      startTime,
      endTime,
      color: generateProcessColor(process.id),
    })

    currentTime = endTime

    return {
      ...process,
      completionTime: endTime,
      turnaroundTime: endTime - process.arrivalTime,
      waitingTime: startTime - process.arrivalTime,
    }
  })

  return calculateMetrics(result, ganttChart)
}

// Shortest Job First (SJF) - Non-Preemptive
export const sjfScheduling = (processes: Process[]): SchedulingResult => {
  const remainingProcesses = [...processes]
  const completedProcesses: Process[] = []
  const ganttChart: GanttChartItem[] = []
  let currentTime = 0

  while (remainingProcesses.length > 0) {
    const availableProcesses = remainingProcesses.filter((p) => p.arrivalTime <= currentTime)

    if (availableProcesses.length === 0) {
      currentTime = Math.min(...remainingProcesses.map((p) => p.arrivalTime))
      continue
    }

    const shortestJob = availableProcesses.reduce((shortest, current) =>
      current.burstTime < shortest.burstTime ? current : shortest,
    )

    const startTime = currentTime
    const endTime = startTime + shortestJob.burstTime

    ganttChart.push({
      processId: shortestJob.id,
      startTime,
      endTime,
      color: generateProcessColor(shortestJob.id),
    })

    completedProcesses.push({
      ...shortestJob,
      completionTime: endTime,
      turnaroundTime: endTime - shortestJob.arrivalTime,
      waitingTime: startTime - shortestJob.arrivalTime,
    })

    currentTime = endTime
    remainingProcesses.splice(remainingProcesses.indexOf(shortestJob), 1)
  }

  return calculateMetrics(completedProcesses, ganttChart)
}

// Shortest Remaining Time First (SRTF) - Preemptive
export const srtfScheduling = (processes: Process[]): SchedulingResult => {
  const processQueue = processes.map((p) => ({ ...p, remainingTime: p.burstTime }))
  const completedProcesses: Process[] = []
  const ganttChart: GanttChartItem[] = []
  let currentTime = 0
  let currentProcess: Process | null = null

  const maxTime = Math.max(...processes.map((p) => p.arrivalTime + p.burstTime)) + 100

  while (completedProcesses.length < processes.length && currentTime < maxTime) {
    const availableProcesses = processQueue.filter((p) => p.arrivalTime <= currentTime && p.remainingTime! > 0)

    if (availableProcesses.length === 0) {
      currentTime++
      continue
    }

    const shortestProcess = availableProcesses.reduce((shortest, current) =>
      current.remainingTime! < shortest.remainingTime! ? current : shortest,
    )

    if (currentProcess?.id !== shortestProcess.id) {
      currentProcess = shortestProcess
    }

    const startTime = currentTime
    shortestProcess.remainingTime!--
    currentTime++

    if (shortestProcess.remainingTime === 0) {
      completedProcesses.push({
        ...shortestProcess,
        completionTime: currentTime,
        turnaroundTime: currentTime - shortestProcess.arrivalTime,
        waitingTime: currentTime - shortestProcess.arrivalTime - shortestProcess.burstTime,
      })
    }

    // Merge consecutive time slots for the same process
    const lastGanttItem = ganttChart[ganttChart.length - 1]
    if (lastGanttItem && lastGanttItem.processId === shortestProcess.id && lastGanttItem.endTime === startTime) {
      lastGanttItem.endTime = currentTime
    } else {
      ganttChart.push({
        processId: shortestProcess.id,
        startTime,
        endTime: currentTime,
        color: generateProcessColor(shortestProcess.id),
      })
    }
  }

  return calculateMetrics(completedProcesses, ganttChart)
}

// Round Robin (RR)
export const roundRobinScheduling = (processes: Process[], timeQuantum: number): SchedulingResult => {
  const processQueue = processes.map((p) => ({ ...p, remainingTime: p.burstTime }))
  const readyQueue: Process[] = []
  const completedProcesses: Process[] = []
  const ganttChart: GanttChartItem[] = []
  let currentTime = 0

  // Add processes that arrive at time 0
  processQueue.forEach((p) => {
    if (p.arrivalTime === 0) {
      readyQueue.push(p)
    }
  })

  while (completedProcesses.length < processes.length) {
    // Add newly arrived processes to ready queue
    processQueue.forEach((p) => {
      if (p.arrivalTime === currentTime && p.remainingTime! > 0 && !readyQueue.includes(p)) {
        readyQueue.push(p)
      }
    })

    if (readyQueue.length === 0) {
      currentTime++
      continue
    }

    const currentProcess = readyQueue.shift()!
    const executionTime = Math.min(timeQuantum, currentProcess.remainingTime!)
    const startTime = currentTime
    const endTime = startTime + executionTime

    ganttChart.push({
      processId: currentProcess.id,
      startTime,
      endTime,
      color: generateProcessColor(currentProcess.id),
    })

    currentProcess.remainingTime! -= executionTime
    currentTime = endTime

    // Add newly arrived processes
    processQueue.forEach((p) => {
      if (p.arrivalTime <= currentTime && p.remainingTime! > 0 && !readyQueue.includes(p) && p !== currentProcess) {
        readyQueue.push(p)
      }
    })

    if (currentProcess.remainingTime === 0) {
      completedProcesses.push({
        ...currentProcess,
        completionTime: currentTime,
        turnaroundTime: currentTime - currentProcess.arrivalTime,
        waitingTime: currentTime - currentProcess.arrivalTime - currentProcess.burstTime,
      })
    } else {
      readyQueue.push(currentProcess)
    }
  }

  return calculateMetrics(completedProcesses, ganttChart)
}

// Priority Scheduling (Preemptive and Non-Preemptive)
export const priorityScheduling = (processes: Process[], isPreemptive: boolean): SchedulingResult => {
  if (isPreemptive) {
    return preemptivePriorityScheduling(processes)
  } else {
    return nonPreemptivePriorityScheduling(processes)
  }
}

const nonPreemptivePriorityScheduling = (processes: Process[]): SchedulingResult => {
  const remainingProcesses = [...processes]
  const completedProcesses: Process[] = []
  const ganttChart: GanttChartItem[] = []
  let currentTime = 0

  while (remainingProcesses.length > 0) {
    const availableProcesses = remainingProcesses.filter((p) => p.arrivalTime <= currentTime)

    if (availableProcesses.length === 0) {
      currentTime = Math.min(...remainingProcesses.map((p) => p.arrivalTime))
      continue
    }

    const highestPriorityProcess = availableProcesses.reduce((highest, current) =>
      (current.priority || 0) < (highest.priority || 0) ? current : highest,
    )

    const startTime = currentTime
    const endTime = startTime + highestPriorityProcess.burstTime

    ganttChart.push({
      processId: highestPriorityProcess.id,
      startTime,
      endTime,
      color: generateProcessColor(highestPriorityProcess.id),
    })

    completedProcesses.push({
      ...highestPriorityProcess,
      completionTime: endTime,
      turnaroundTime: endTime - highestPriorityProcess.arrivalTime,
      waitingTime: startTime - highestPriorityProcess.arrivalTime,
    })

    currentTime = endTime
    remainingProcesses.splice(remainingProcesses.indexOf(highestPriorityProcess), 1)
  }

  return calculateMetrics(completedProcesses, ganttChart)
}

const preemptivePriorityScheduling = (processes: Process[]): SchedulingResult => {
  const processQueue = processes.map((p) => ({ ...p, remainingTime: p.burstTime }))
  const completedProcesses: Process[] = []
  const ganttChart: GanttChartItem[] = []
  let currentTime = 0
  let currentProcess: Process | null = null

  const maxTime = Math.max(...processes.map((p) => p.arrivalTime + p.burstTime)) + 100

  while (completedProcesses.length < processes.length && currentTime < maxTime) {
    const availableProcesses = processQueue.filter((p) => p.arrivalTime <= currentTime && p.remainingTime! > 0)

    if (availableProcesses.length === 0) {
      currentTime++
      continue
    }

    const highestPriorityProcess = availableProcesses.reduce((highest, current) =>
      (current.priority || 0) < (highest.priority || 0) ? current : highest,
    )

    if (currentProcess?.id !== highestPriorityProcess.id) {
      currentProcess = highestPriorityProcess
    }

    const startTime = currentTime
    highestPriorityProcess.remainingTime!--
    currentTime++

    if (highestPriorityProcess.remainingTime === 0) {
      completedProcesses.push({
        ...highestPriorityProcess,
        completionTime: currentTime,
        turnaroundTime: currentTime - highestPriorityProcess.arrivalTime,
        waitingTime: currentTime - highestPriorityProcess.arrivalTime - highestPriorityProcess.burstTime,
      })
    }

    // Merge consecutive time slots for the same process
    const lastGanttItem = ganttChart[ganttChart.length - 1]
    if (lastGanttItem && lastGanttItem.processId === highestPriorityProcess.id && lastGanttItem.endTime === startTime) {
      lastGanttItem.endTime = currentTime
    } else {
      ganttChart.push({
        processId: highestPriorityProcess.id,
        startTime,
        endTime: currentTime,
        color: generateProcessColor(highestPriorityProcess.id),
      })
    }
  }

  return calculateMetrics(completedProcesses, ganttChart)
}

// Calculate performance metrics
const calculateMetrics = (processes: Process[], ganttChart: GanttChartItem[]): SchedulingResult => {
  const totalWaitingTime = processes.reduce((sum, p) => sum + (p.waitingTime || 0), 0)
  const totalTurnaroundTime = processes.reduce((sum, p) => sum + (p.turnaroundTime || 0), 0)
  const totalTime = Math.max(...ganttChart.map((g) => g.endTime))
  const totalBurstTime = processes.reduce((sum, p) => sum + p.burstTime, 0)

  return {
    ganttChart,
    processes,
    averageWaitingTime: totalWaitingTime / processes.length,
    averageTurnaroundTime: totalTurnaroundTime / processes.length,
    cpuUtilization: (totalBurstTime / totalTime) * 100,
    throughput: processes.length / totalTime,
  }
}
