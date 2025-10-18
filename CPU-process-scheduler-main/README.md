# CPU Process Scheduling Visualizer

An interactive, modern web app to learn and visualize CPU process scheduling algorithms. Add processes, configure algorithms, watch an animated Gantt chart, inspect the ready queue in real time, and review performance metrics. Export your results to CSV or a PNG snapshot.

## Features

- Interactive process input with validation (unique IDs, non-negative times)
- Supported algorithms:
  - FCFS (First Come First Serve)
  - SJF (Shortest Job First, non-preemptive)
  - SRTF (Shortest Remaining Time First, preemptive SJF)
  - Round Robin (with configurable time quantum)
  - Priority Scheduling (preemptive and non-preemptive; lower number = higher priority)
- Animated Gantt chart with a moving time cursor and color-coded process blocks
- Real-time Ready Queue panel to see waiting/executing/completed states
- Metrics Dashboard:
  - Average Waiting Time
  - Average Turnaround Time
  - CPU Utilization
  - Throughput
- Export:
  - CSV: process table, metrics, and Gantt sequence
  - PNG: Gantt chart + key metrics
- Demo and Random data generators for quick exploration
- Responsive UI built with shadcn/ui + Tailwind CSS v4

## Quick Start

Prerequisites
- Node.js 18+ (or 20+ recommended)
- npm 

Install and run locally
- npm
  - npm install
  - npm run dev

Open http://localhost:3000

Build and start production
- npm run build && npm start

## Usage

1. Add Process
   - Enter a unique Process ID (e.g., P1), Arrival Time, and Burst Time.
   - For Priority Scheduling, also enter Priority (lower = higher priority).
   - Use Demo Data or Random Data to prefill examples.

2. Configure Algorithm
   - Choose FCFS, SJF, SRTF, Round Robin (set time quantum), or Priority (choose preemptive or non-preemptive).

3. Run & Visualize
   - Click Run Algorithm to generate results.
   - Use Play/Pause/Reset controls on the Gantt Chart.
   - Adjust animation speed via the slider.

4. Inspect State & Metrics
   - Ready Queue shows processes by state over time.
   - Metrics Dashboard shows averages, utilization, and throughput.

5. Export
   - Export CSV for process details, metrics, and the Gantt sequence.
   - Export PNG to save the Gantt chart visualization with key metrics.

## Algorithms Notes

- FCFS: Executes in arrival order; simple but may cause convoy effect.
- SJF (non-preemptive): Picks the shortest job among available; can minimize average waiting time but may starve long jobs.
- SRTF (preemptive SJF): Always runs the process with the shortest remaining time; preempts when a shorter job arrives.
- Round Robin: Cycles through ready processes with a fixed time quantum for fairness.
- Priority: Schedules by priority value (lower number = higher priority), with preemptive and non-preemptive options.

Tie-breaking behavior generally follows the order in which processes become available and internal iteration order.

## Project Structure

- app/
  - page.tsx — Main UI: inputs, controls, Gantt, Ready Queue, Metrics, Export
  - layout.tsx, globals.css — App shell and theme tokens
- components/
  - gantt-chart.tsx — Animated timeline visualization
  - ready-queue.tsx — Real-time process state display
  - metrics-dashboard.tsx — KPIs and per-process stats
  - export-controls.tsx — CSV and PNG export actions
  - ui/* — shadcn/ui components
- lib/
  - scheduling-algorithms.ts — TypeScript implementations + metrics:
    - fcfsScheduling, sjfScheduling, srtfScheduling, roundRobinScheduling, priorityScheduling
- public/
  - placeholder assets

## Tech Stack

- Next.js (App Router)
- React 19, TypeScript
- Tailwind CSS v4 with shadcn/ui (Radix UI, lucide-react icons)
