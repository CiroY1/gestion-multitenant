import type { Route } from '@angular/router'
import { Area } from './area/area'
import { Bar } from './bar/bar'
import { Bubble } from './bubble/bubble'
import { Candlestick } from './candlestick/candlestick'
import { Column } from './column/column'
import { Heatmap } from './heatmap/heatmap'
import { Line } from './line/line'
import { Mixed } from './mixed/mixed'
import { Timeline } from './timeline/timeline'
import { Boxplot } from './boxplot/boxplot'
import { Treemap } from './treemap/treemap'
import { Pie } from './pie/pie'
import { Radar } from './radar/radar'
import { RadialBar } from './radial-bar/radial-bar'
import { Scatter } from './scatter/scatter'
import { Polar } from './polar/polar'

export const CHART_ROUTE: Route[] = [
  {
    path: 'area',
    component: Area,
    data: { title: 'Apex Area Charts' },
  },
  {
    path: 'bar',
    component: Bar,
    data: { title: 'Apex Bar Charts' },
  },
  {
    path: 'bubble',
    component: Bubble,
    data: { title: 'Apex Bubble Charts' },
  },
  {
    path: 'candlestick',
    component: Candlestick,
    data: { title: 'Apex Candlestick Charts' },
  },
  {
    path: 'column',
    component: Column,
    data: { title: 'Apex Column Charts' },
  },
  {
    path: 'heatmap',
    component: Heatmap,
    data: { title: 'Apex Heatmap Charts' },
  },
  {
    path: 'line',
    component: Line,
    data: { title: 'Apex Line Charts' },
  },
  {
    path: 'mixed',
    component: Mixed,
    data: { title: 'Apex Mixed Charts' },
  },
  {
    path: 'timeline',
    component: Timeline,
    data: { title: 'Apex Timeline Charts' },
  },
  {
    path: 'boxplot',
    component: Boxplot,
    data: { title: 'Apex Boxplot Charts' },
  },
  {
    path: 'treemap',
    component: Treemap,
    data: { title: 'Apex Treemap Charts' },
  },
  {
    path: 'pie',
    component: Pie,
    data: { title: 'Apex Pie Charts' },
  },
  {
    path: 'radar',
    component: Radar,
    data: { title: 'Apex Radar Charts' },
  },
  {
    path: 'radial-bar',
    component: RadialBar,
    data: { title: 'Apex RadialBar Charts' },
  },
  {
    path: 'scatter',
    component: Scatter,
    data: { title: 'Apex Scatter Charts' },
  },

  {
    path: 'polar',
    component: Polar,
    data: { title: 'Apex Polar Area Charts' },
  },
]
