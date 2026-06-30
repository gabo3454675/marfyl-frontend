'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

/**
 * Carga lazy de recharts con un dynamic() por componente.
 * Tipado como ComponentType<any> para compatibilidad con props de Recharts en build estricto.
 */
function lazyRecharts(name: string): ComponentType<any> {
  return dynamic(
    () =>
      import('recharts').then((mod) => {
        const Component = (mod as any)[name] as ComponentType<any>;
        return { default: Component };
      }),
    { ssr: false },
  );
}

export const LazyResponsiveContainer = lazyRecharts('ResponsiveContainer');
export const LazyLineChart = lazyRecharts('LineChart');
export const LazyLine = lazyRecharts('Line');
export const LazyBarChart = lazyRecharts('BarChart');
export const LazyBar = lazyRecharts('Bar');
export const LazyPieChart = lazyRecharts('PieChart');
export const LazyPie = lazyRecharts('Pie');
export const LazyCell = lazyRecharts('Cell');
export const LazyAreaChart = lazyRecharts('AreaChart');
export const LazyArea = lazyRecharts('Area');
export const LazyComposedChart = lazyRecharts('ComposedChart');
export const LazyScatterChart = lazyRecharts('ScatterChart');
export const LazyScatter = lazyRecharts('Scatter');
export const LazyCartesianGrid = lazyRecharts('CartesianGrid');
export const LazyXAxis = lazyRecharts('XAxis');
export const LazyYAxis = lazyRecharts('YAxis');
export const LazyZAxis = lazyRecharts('ZAxis');
export const LazyTooltip = lazyRecharts('Tooltip');
export const LazyLegend = lazyRecharts('Legend');
export const LazyReferenceLine = lazyRecharts('ReferenceLine');
