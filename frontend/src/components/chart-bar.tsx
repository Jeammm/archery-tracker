import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChartLabelProps } from "./chart-line-label";
import { cn } from "@/lib/utils";

export const description = "A bar chart with a label";

export function ChartBar(props: LineChartLabelProps) {
  const {
    title,
    description,
    chartConfig,
    chartData,
    xAxisDataKey,
    footer,
    chartContainerClassName,
    stack,
  } = props;

  const lineDataKey = Object.keys(chartConfig);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className={cn(["h-[250px] aspect-auto", chartContainerClassName])}
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <YAxis />
            <XAxis
              dataKey={xAxisDataKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {lineDataKey.map((dataKey, index) => {
              return (
                <Bar
                  key={dataKey}
                  dataKey={dataKey}
                  fill={`var(--color-${dataKey})`}
                  radius={
                    stack
                      ? [
                          index === lineDataKey.length - 1 ? 4 : 0,
                          index === lineDataKey.length - 1 ? 4 : 0,
                          index === 0 ? 4 : 0,
                          index === 0 ? 4 : 0,
                        ]
                      : 8
                  }
                  stackId={stack ? "a" : index}
                />
              );
            })}
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {footer}
      </CardFooter>
    </Card>
  );
}
