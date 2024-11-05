import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
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
import { Round } from "@/types/session";
import { useMemo } from "react";
import { set } from "lodash";

export const description = "A donut chart with text";

type RoundDataItem = {
  round: string;
  score: number;
  fill: string;
};

export interface ChartPieProps {
  title: string;
  description: string;
  dataKey: string;
  nameKey: string;
  chartContainerClassName?: string;
  totalLable?: string;
  round_result: Round[];
}

export function ChartPie(props: ChartPieProps) {
  const { title, description, dataKey, nameKey, totalLable, round_result } =
    props;

  const roundData = useMemo(() => {
    return round_result
      .filter((round) => round.total_score && round.total_score > 0)
      .map((round) => ({
        round: round._id,
        score: round.total_score,
        fill: `var(--color-${round._id})`,
      }));
  }, [round_result]);

  const mockRoundData = useMemo(() => {
    return new Array(4).fill(null).map((_, index) => {
      return {
        round: index + 1,
        score: Math.floor(Math.random() * 100),
        fill: `var(--color-${index + 1})`,
      };
    });
  }, []);

  const total = React.useMemo(() => {
    return roundData.reduce(
      (acc, curr) => acc + (curr[dataKey as keyof RoundDataItem] as number),
      0
    );
  }, [roundData, dataKey]);

  const pieChartConfig = useMemo(() => {
    const config = {};

    round_result
      .filter((round) => round.total_score)
      .map((round, index) => {
        set(config, round._id, {
          label: `Round ${index + 1}`,
          color: `hsl(var(--chart-${(index % 5) + 1}))`,
        });
      });

    return config;
  }, [round_result]);

  const mockPieChartConfig = useMemo(() => {
    const config = {};

    new Array(4).fill(null).map((_, index) => {
      set(config, index + 1, {
        label: `Round ${index + 1}`,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      });
    });

    return config;
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 px-0 relative">
        {roundData.length === 0 && (
          <div className="w-full h-full absolute top-0 left-0 bg-background/50 backdrop-blur-md z-20 flex justify-center items-center rounded-lg">
            <p className="text-2xl italic tracking-wider -mt-20">No Data</p>
          </div>
        )}
        <ChartContainer
          config={roundData.length > 0 ? pieChartConfig : mockPieChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart
            margin={{
              bottom: 10,
            }}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={roundData.length > 0 ? roundData : mockRoundData}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {totalLable || dataKey}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
