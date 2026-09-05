import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const config = defineConfig({
	lang: "en-US",
	title: "Momobase",
	description:
		"Embeddable payment orchestration with one API for every provider.",
	cleanUrls: true,
	lastUpdated: true,
	vite: {
		optimizeDeps: {
			// mermaid imports fastdom's UMD build, which exports through
			// module.exports and so has no ESM default export. Pre-bundling mermaid
			// converts it; without this the dev server serves the raw file and the
			// browser throws "doesn't provide an export named: 'default'".
			// withMermaid appends its own entries to this list.
			include: ["mermaid"],
		},
	},
	head: [
		["link", { rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
		[
			"link",
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32x32.png",
			},
		],
		[
			"link",
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png",
			},
		],
		[
			"link",
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
		],
		["link", { rel: "manifest", href: "/site.webmanifest" }],
	],
	themeConfig: {
		logo: { src: "/logo.svg", alt: "Momobase" },
		nav: [
			{ text: "Home", link: "/" },
			{ text: "About", link: "/about" },
			{ text: "Guide", link: "/guide/" },
			{ text: "SDK", link: "/sdk/" },
			{ text: "API", link: "/api-reference" },
		],

		sidebar: {
			"/guide/": [
				{
					text: "Guide",
					items: [
						{ text: "Understand Momobase", link: "/guide/" },
						{
							text: "Payment lifecycle",
							link: "/guide/payment-lifecycle",
						},
						{ text: "Routing", link: "/guide/routing" },
						{ text: "Get started", link: "/guide/getting-started" },
						{ text: "Deploy a host", link: "/guide/deployment" },
						{ text: "Operate Momobase", link: "/guide/operations" },
					],
				},
				{
					text: "Extend Momobase",
					items: [
						{
							text: "Configure an instance",
							link: "/guide/embedding",
						},
						{ text: "Add hooks", link: "/guide/extensions" },
						{ text: "Build a provider", link: "/guide/providers" },
					],
				},
				{
					text: "Development",
					items: [
						{
							text: "Develop and test",
							link: "/guide/development",
						},
					],
				},
			],
			"/sdk/": [
				{
					text: "TypeScript SDK",
					items: [
						{ text: "Introduction", link: "/sdk/" },
						{
							text: "Install and configure",
							link: "/sdk/installation",
						},
						{
							text: "Application client",
							link: "/sdk/application-client",
						},
						{ text: "Admin client", link: "/sdk/admin-client" },
						{ text: "Sessions and tokens", link: "/sdk/sessions" },
						{
							text: "Errors and cancellation",
							link: "/sdk/errors",
						},
					],
				},
			],
		},

		search: { provider: "local" },
		editLink: {
			pattern:
				"https://github.com/momobasehq/momobasehq.github.io/edit/main/:path",
		},
		socialLinks: [
			{ icon: "github", link: "https://github.com/momobasehq/momobase" },
		],
		footer: {
			message: "Released under the MIT License.",
			copyright:
				'Created by <a href="https://github.com/momobasehq">Momobase HQ</a>.',
		},
		outline: { level: [2, 3] },
	},
});

export default withMermaid(config);
