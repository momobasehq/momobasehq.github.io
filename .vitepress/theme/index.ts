import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import DownloadButtons from "./components/DownloadButtons.vue";
import "./style.css";

export default {
	extends: DefaultTheme,
	enhanceApp({ app }) {
		app.component("DownloadButtons", DownloadButtons);
	},
} satisfies Theme;
