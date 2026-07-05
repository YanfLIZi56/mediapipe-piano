import HomePage from './pages/HomePage';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: '空气音乐演奏',
    path: '/',
    element: <HomePage />,
    public: true,
  }
];
