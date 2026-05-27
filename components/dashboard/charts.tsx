"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { name: "Jan", views: 0, clips: 0 },
  { name: "Feb", views: 0, clips: 0 },
  { name: "Mar", views: 0, clips: 0 },
  { name: "Apr", views: 0, clips: 0 },
  { name: "May", views: 0, clips: 0 },
  { name: "Jun", views: 0, clips: 0 },
  { name: "Jul", views: 0, clips: 0 },
]

export function DashboardChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#888", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#888", fontSize: 12 }}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111",
              border: "1px solid #333",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="clips"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
