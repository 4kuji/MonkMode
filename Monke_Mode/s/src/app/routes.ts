import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { TimerPage } from "./components/TimerPage";
import { StatsPage } from "./components/StatsPage";
import { AIPage } from "./components/AIPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: TimerPage },
      { path: "istatistikler", Component: StatsPage },
      { path: "yapay-zeka", Component: AIPage },
    ],
  },
]);
