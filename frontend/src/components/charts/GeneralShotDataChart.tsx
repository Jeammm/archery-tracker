import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Round } from "@/types/session";
import { useMemo } from "react";

interface GeneralShotDataChartProps {
  round_result: Round[];
}

export function GeneralShotDataChart(props: GeneralShotDataChartProps) {
  const { round_result } = props;

  const chartConfig = {
    score: {
      label: "Score",
      color: "hsl(var(--chart-1))",
    },
  };

  const roundData = useMemo(() => {
    const roundsData: { shotNo: number; score: number }[] = [];

    round_result.map((round) => {
      round.score?.map((hit) => {
        roundsData.push({
          shotNo: hit.id,
          score: hit.score,
        });
      });
    });
    return roundsData;
  }, [round_result]);

  const mockRoundData = useMemo(() => {
    return new Array(15).fill(null).map((_, index) => {
      return {
        shotNo: index,
        score: Math.floor(Math.random() * 10),
      };
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shot Statistic</CardTitle>
        <CardDescription>Your Shot Statistic</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        {roundData.length === 0 && (
          <div className="w-full h-full absolute top-0 left-0 bg-background/50 backdrop-blur-md z-20 flex justify-center items-center rounded-lg">
            <p className="text-2xl italic tracking-wider -mt-20">
              No shot data detected
            </p>
          </div>
        )}
        <ChartContainer
          config={chartConfig}
          className={cn(["h-[250px] aspect-auto"])}
        >
          <BarChart
            accessibilityLayer
            data={roundData.length > 0 ? roundData : mockRoundData}
            margin={{
              top: 20,
            }}
            barGap={4}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              tickMargin={0}
              tickLine={true}
              axisLine={true}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="score"
              fill={`var(--color-score)`}
              radius={[2, 2, 0, 0]}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={10}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
