import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const config = defineConfig({
	lang: "en-US",
	title: "Momobase",
	description:
		"Embeddable payment orchestration with one API for every provider.",
	cleanUrls: true,
	// The repository README is for GitHub, not a page on the site.
	srcExclude: ["README.md"],
	lastUpdated: true,
	vite: {
		optimizeDeps: {
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
			{ text: "Guide", link: "/guide/" },
			{ text: "Server", link: "/server/" },
			{ text: "Library", link: "/library/" },
			{ text: "SDK", link: "/sdk/" },
			{
				text: "API",
				items: [
					{ text: "HTTP conventions", link: "/api/conventions" },
					{ text: "OpenAPI explorer", link: "/api-reference" },
				],
			},
			{
				text: "About",
				items: [
					{ text: "About Momobase", link: "/about" },
					{ text: "Contributing", link: "/contributing" },
				],
			},
		],

		sidebar: {
			"/guide/": [
				{
					text: "Guide",
					items: [
						{ text: "Understand Momobase", link: "/guide/" },
						{
							text: "Choose your integration",
							link: "/guide/choose",
						},
						{
							text: "Create your first payment",
							link: "/guide/first-payment",
						},
					],
				},
				{
					text: "How it works",
					items: [
						{
							text: "Payment lifecycle",
							link: "/guide/payment-lifecycle",
						},
						{ text: "Routing", link: "/guide/routing" },
					],
				},
			],
			"/server/": [
				{
					text: "Momobase Server",
					items: [
						{ text: "Overview", link: "/server/" },
						{ text: "Install", link: "/server/install" },
						{
							text: "Configuration",
							link: "/server/configuration",
						},
						{
							text: "Command-line interface",
							link: "/server/cli",
						},
					],
				},
				{
					text: "Run it",
					items: [
						{ text: "Deployment", link: "/server/deployment" },
						{ text: "Operations", link: "/server/operations" },
					],
				},
			],
			"/library/": [
				{
					text: "Go package",
					items: [
						{ text: "Overview", link: "/library/" },
						{
							text: "Embed an instance",
							link: "/library/embedding",
						},
						{
							text: "Configuration",
							link: "/library/configuration",
						},
					],
				},
				{
					text: "Extend it",
					items: [
						{ text: "Add payment hooks", link: "/library/hooks" },
						{
							text: "Build a provider adapter",
							link: "/library/providers",
						},
					],
				},
				{
					text: "Reference",
					items: [
						{ text: "Go API", link: "/library/go-api" },
						{
							text: "Provider API",
							link: "/library/provider-api",
						},
					],
				},
			],
			"/sdk/": [
				{
					text: "TypeScript SDK",
					items: [
						{ text: "Overview", link: "/sdk/" },
						{
							text: "Install and configure",
							link: "/sdk/installation",
						},
					],
				},
				{
					text: "Clients",
					items: [
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
			"/api/": [
				{
					text: "API",
					items: [
						{
							text: "HTTP conventions",
							link: "/api/conventions",
						},
						{
							text: "OpenAPI explorer",
							link: "/api-reference",
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
			{ icon: "github", link: "https://github.com/momobasehq" },
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
