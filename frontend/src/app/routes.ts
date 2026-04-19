import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { TimerPage } from "./components/TimerPage";
import { StatsPage } from "./components/StatsPage";
import { AIPage } from "./components/AIPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: TimerPage },
      { path: "istatistikler", Component: StatsPage },
      { path: "yapay-zeka", Component: AIPage },
      { path: "giris-yap", Component: LoginPage },
      { path: "kayit-ol", Component: SignupPage },
    ],
  },
]);