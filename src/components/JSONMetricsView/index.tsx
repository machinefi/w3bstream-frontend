import { Stack } from '@chakra-ui/react';
import { BarChartCard } from './BarChartCard';
import { LineChartCard } from './LineChartCard';
import { ProgressCard } from './ProgressCard';
import { TimeRangePick } from './TimeRangePick';

export interface JSONMetricsView {
  type: 'ProgressCard' | 'BarChartCard' | 'LineChartCard' | 'TimeRangePick';
  data: ProgressCard | BarChartCard | LineChartCard | TimeRangePick;
}

export const JSONMetricsView = ({ data }: { data: JSONMetricsView[] }) => {
  return (
    <Stack h="calc(100vh - 100px)" spacing={6} p="10px" overflowY="scroll">
      {data.map((item) => {
        switch (item.type) {
          case 'ProgressCard':
            return <ProgressCard {...(item.data as ProgressCard)} />;
          case 'BarChartCard':
            return <BarChartCard {...(item.data as BarChartCard)} />;
          case 'LineChartCard':
            return <LineChartCard {...(item.data as LineChartCard)} />;
          case 'TimeRangePick':
            return <TimeRangePick {...(item.data as TimeRangePick)} />;
          default:
            return null;
        }
      })}
    </Stack>
  );
};
