'use client';

import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ChartWrapperProps {
  options: Highcharts.Options;
}

export default function ChartWrapper({ options }: ChartWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-72 w-full flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <span className="text-xs text-slate-400">Cargando visualización gráfica...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}

