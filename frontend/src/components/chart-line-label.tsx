/* eslint-disable @typescript-eslint/no-explicit-any */
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LineChartLabelProps {
  title: string;
  description: string;
  chartConfig: ChartConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData: any[];
  xAxisDataKey: string;
  footer?: ReactNode;
  chartContainerClassName?: string;
  stack?: boolean;
}

export function LineChartLabel(props: LineChartLabelProps) {
  const {
    title,
    description,
    chartConfig,
    chartData,
    xAxisDataKey,
    footer,
    chartContainerClassName,
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
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              left: 50,
              right: 30,
              bottom: 10,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              tick={<CustomizedAxisTick />}
              dataKey={xAxisDataKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            {lineDataKey.map((dataKey) => {
              return (
                <Line
                  key={dataKey}
                  dataKey={dataKey}
                  type="natural"
                  stroke={`var(--color-${dataKey})`}
                  strokeWidth={2}
                  dot={{
                    fill: `var(--color-${dataKey})`,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                >
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Line>
              );
            })}
          </LineChart>
        </ChartContainer>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

interface TickProps {
  fill?: any;
  height?: any;
  orientation?: any;
  payload?: any;
  stroke?: any;
  textAnchor?: any;
  type?: any;
  width?: any;
  x?: any;
  y?: any;
}

function CustomizedAxisTick(props: TickProps) {
  const {
    fill,
    height,
    orientation,
    payload,
    stroke,
    textAnchor,
    type,
    width,
    x,
    y,
  } = props;

  return (
    <text
      {...{ fill, height, orientation, stroke, textAnchor, type, width, x, y }}
      className="recharts-text recharts-cartesian-axis-tick-value"
    >
      {payload.value.split("\n").map((value: string, index: number) => {
        const dy = 0.3 * (index + 1) + "em";
        return (
          <tspan dy={dy} key={index} x={payload.tickCoord}>
            {value}
          </tspan>
        );
      })}
    </text>
  );
}
