import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import mermaid from "mermaid";
import elkLayouts from "@mermaid-js/layout-elk";
import DownloadButtons from "./components/DownloadButtons.vue";
import "./style.css";

export default {
	extends: DefaultTheme,
	enhanceApp({ app }) {
		mermaid.registerLayoutLoaders(elkLayouts);
		app.component("DownloadButtons", DownloadButtons);
	},
} satisfies Theme;
