"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, ImageIcon, Loader2 } from "lucide-react"
import type { SchedulingResult } from "@/lib/scheduling-algorithms"

interface ExportControlsProps {
  result: SchedulingResult | null
  algorithm: string
  processes: any[]
}

export function ExportControls({ result, algorithm, processes }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToCSV = () => {
    if (!result) return

    setIsExporting(true)

    try {
      // Create CSV content
      const headers = [
        "Process ID",
        "Arrival Time",
        "Burst Time",
        "Priority",
        "Completion Time",
        "Waiting Time",
        "Turnaround Time",
      ]
      const csvContent = [
        headers.join(","),
        ...result.processes.map((process) =>
          [
            process.id,
            process.arrivalTime,
            process.burstTime,
            process.priority || "N/A",
            process.completionTime || "N/A",
            process.waitingTime?.toFixed(2) || "N/A",
            process.turnaroundTime?.toFixed(2) || "N/A",
          ].join(","),
        ),
      ].join("\n")

      // Add summary metrics
      const summary = [
        "",
        "PERFORMANCE METRICS",
        `Algorithm,${algorithm.toUpperCase()}`,
        `Average Waiting Time,${result.averageWaitingTime.toFixed(2)}`,
        `Average Turnaround Time,${result.averageTurnaroundTime.toFixed(2)}`,
        `CPU Utilization,${result.cpuUtilization.toFixed(2)}%`,
        `Throughput,${result.throughput.toFixed(4)} processes/ms`,
        "",
        "GANTT CHART SEQUENCE",
        "Process ID,Start Time,End Time,Duration",
        ...result.ganttChart.map((item) =>
          [item.processId, item.startTime, item.endTime, item.endTime - item.startTime].join(","),
        ),
      ].join("\n")

      const fullCSV = csvContent + "\n" + summary

      // Download CSV
      const blob = new Blob([fullCSV], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `cpu_scheduling_${algorithm}_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPNG = async () => {
    if (!result) return

    setIsExporting(true)

    try {
      // Create a canvas to draw the Gantt chart
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const maxTime = Math.max(...result.ganttChart.map((item) => item.endTime))
      const timeScale = 40 // pixels per time unit
      const chartHeight = 80
      const headerHeight = 100
      const footerHeight = 150

      canvas.width = Math.max(800, maxTime * timeScale + 100)
      canvas.height = headerHeight + chartHeight + footerHeight

      // Set background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw title
      ctx.fillStyle = "#000000"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`CPU Scheduling - ${algorithm.toUpperCase()}`, canvas.width / 2, 30)

      // Draw time axis
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      for (let i = 0; i <= maxTime; i++) {
        const x = 50 + i * timeScale
        ctx.fillStyle = "#666666"
        ctx.fillRect(x, headerHeight - 20, 1, 10)
        ctx.fillText(i.toString(), x, headerHeight - 5)
      }

      // Draw Gantt chart blocks
      result.ganttChart.forEach((item, index) => {
        const x = 50 + item.startTime * timeScale
        const width = (item.endTime - item.startTime) * timeScale
        const y = headerHeight

        // Draw process block
        ctx.fillStyle = item.color
        ctx.fillRect(x, y, width, chartHeight - 20)

        // Draw process label
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 14px Arial"
        ctx.textAlign = "center"
        if (width > 30) {
          ctx.fillText(item.processId, x + width / 2, y + (chartHeight - 20) / 2 + 5)
        }
      })

      // Draw metrics
      ctx.fillStyle = "#000000"
      ctx.font = "14px Arial"
      ctx.textAlign = "left"
      const metricsY = headerHeight + chartHeight + 30
      ctx.fillText(`Average Waiting Time: ${result.averageWaitingTime.toFixed(2)}ms`, 50, metricsY)
      ctx.fillText(`Average Turnaround Time: ${result.averageTurnaroundTime.toFixed(2)}ms`, 50, metricsY + 25)
      ctx.fillText(`CPU Utilization: ${result.cpuUtilization.toFixed(2)}%`, 50, metricsY + 50)
      ctx.fillText(`Throughput: ${result.throughput.toFixed(4)} processes/ms`, 50, metricsY + 75)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `gantt_chart_${algorithm}_${new Date().toISOString().split("T")[0]}.png`
          link.click()
          URL.revokeObjectURL(url)
        }
        setIsExporting(false)
      })
    } catch (error) {
      console.error("PNG export failed:", error)
      setIsExporting(false)
    }
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            Run an algorithm to enable export options
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={exportToCSV} disabled={isExporting} variant="outline" className="flex-1 bg-transparent">
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Export CSV Data
          </Button>
          <Button onClick={exportToPNG} disabled={isExporting} variant="outline" className="flex-1 bg-transparent">
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
            Export Gantt Chart PNG
          </Button>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>CSV includes process details, performance metrics, and Gantt chart sequence.</p>
          <p>PNG exports a visual representation of the Gantt chart with key metrics.</p>
        </div>
      </CardContent>
    </Card>
  )
}
