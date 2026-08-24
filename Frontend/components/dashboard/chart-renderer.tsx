"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartSpec = {
  type: "line" | "bar" | "pie" | "donut";
  data: Array<Record<string, unknown>>;
  x_key?: string;
  y_key?: string;
  label_key?: string;
  value_key?: string;
  title?: string;
};

type ChartRendererProps = {
  chart: ChartSpec;
};

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#6366f1", "#14b8a6"];

export function ChartRenderer({ chart }: ChartRendererProps) {
  const { type, data, title, x_key, y_key, label_key, value_key } = chart;
  if (!data || data.length === 0) {
    return (
      <Card className="p-4 bg-white/5 border-white/10 text-xs text-slate-400">
        No chart data available.
      </Card>
    );
  }

  const renderChart = () => {
    if (type === "pie" || type === "donut") {
      const key = label_key || "label";
      const value = value_key || "value";
      return (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey={value}
              nameKey={key}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={type === "donut" ? 40 : 0}
              label
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    const xk = x_key || "x";
    const yk = y_key || "y";
    if (type === "line") {
      return (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={xk} stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Line type="monotone" dataKey={yk} stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey={xk} stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Bar dataKey={yk} fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="p-4 bg-white/5 border-white/10">
      {title && (
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-300">
          <BarChart3 className="h-4 w-4" />
          {title}
        </div>
      )}
      {renderChart()}
    </Card>
  );
}
