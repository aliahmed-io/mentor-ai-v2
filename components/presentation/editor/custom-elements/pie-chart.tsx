"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";
import { Cell, Legend, Pie, PieChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { TChartNode } from "../plugins/chart-plugin";

type AnyRecord = Record<string, unknown>;

function getLabelKey(data: unknown[]): string {
  if (data.length === 0) return "label";
  const sample = data[0] as AnyRecord;
  if ("label" in sample) return "label";
  if ("name" in sample) return "name";
  return "label";
}

function getValueKey(data: unknown[]): string {
  if (data.length === 0) return "value";
  const sample = data[0] as AnyRecord;
  if ("value" in sample) return "value";
  if ("count" in sample) return "count";
  return "value";
}

export default function PieChartElement(props: PlateElementProps<TChartNode>) {
  const rawData = (props.element as TChartNode).data as unknown;
  const dataArray = Array.isArray(rawData) ? (rawData as AnyRecord[]) : [];
  const labelKey = getLabelKey(dataArray);
  const valueKey = getValueKey(dataArray);

  const chartConfig: ChartConfig = {
    [valueKey]: {
      label: "Value",
      color: "var(--presentation-primary)",
    },
  };

  const colors = [
    "var(--presentation-primary)",
    "var(--presentation-secondary)",
    "var(--presentation-accent)",
    "var(--presentation-text)",
    "var(--presentation-muted)",
  ];

  return (
    <PlateElement {...props}>
      <div
        className={cn(
          "relative mb-4 w-full rounded-lg border bg-card p-2 shadow-sm",
        )}
        style={{
          backgroundColor: "var(--presentation-background)",
          color: "var(--presentation-text)",
          borderColor: "var(--presentation-accent)",
        }}
        contentEditable={false}
      >
        <ChartContainer className="h-[19rem] w-full" config={chartConfig}>
          <PieChart>
            <Pie
              data={dataArray}
              dataKey={valueKey}
              nameKey={labelKey}
              outerRadius={110}
              isAnimationActive={true}
              labelLine={false}
              label={({ percent }) =>
                percent !== undefined
                  ? `${Math.round((percent as number) * 100)}%`
                  : ""
              }
            >
              {dataArray.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Legend />
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
        {/* non-editable */}
      </div>
    </PlateElement>
  );
}
