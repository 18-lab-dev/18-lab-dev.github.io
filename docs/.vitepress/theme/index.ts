import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import HomeProjects from "./components/HomeProjects.vue";
import HomePillars from "./components/HomePillars.vue";
import HomeCta from "./components/HomeCta.vue";
import BenchChart from "./components/BenchChart.vue";
import "@fontsource-variable/jetbrains-mono";
import "./style.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("HomeProjects", HomeProjects);
    app.component("HomePillars", HomePillars);
    app.component("HomeCta", HomeCta);
    app.component("BenchChart", BenchChart);
  },
} satisfies Theme;
