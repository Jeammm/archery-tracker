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
  footer: ReactNode;
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
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisDataKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
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
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {footer}
        {/* <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div> */}
      </CardFooter>
    </Card>
  );
}
