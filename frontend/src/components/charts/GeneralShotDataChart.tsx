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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Round } from "@/types/session";

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

  const getRoundData = (rounds: Round[]) => {
    const roundsData: { shotNo: number; score: number }[] = [];

    rounds.map((round) => {
      round.score?.map((hit) => {
        roundsData.push({
          shotNo: hit.id,
          score: hit.score,
        });
      });
    });

    return roundsData;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shot Statistic</CardTitle>
        <CardDescription>Your Shot Statistic</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className={cn(["h-[250px] aspect-auto"])}
        >
          <BarChart
            accessibilityLayer
            data={getRoundData(round_result)}
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
            <ChartLegend content={<ChartLegendContent />} />
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
      {/* <CardFooter className="flex-col items-start gap-2 text-sm">
        {footer}
      </CardFooter> */}
    </Card>
  );
}
