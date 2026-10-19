import { defineConfig } from "vitepress";

export default defineConfig({
	lang: "en-US",
	title: "Momobase",
	description:
		"Embeddable payment orchestration with one API for every provider.",
	cleanUrls: true,
	// The repository README is for GitHub, not a page on the site.
	srcExclude: ["README.md"],
	lastUpdated: true,
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
			{ text: "Docs", link: "/guide/" },
			{ text: "Go package", link: "/library/" },
			{ text: "SDKs", link: "/guide/payments" },
			{ text: "API", link: "/api-reference" },
		],

		sidebar: [
			{
				text: "Getting started",
				items: [
					{ text: "Introduction", link: "/guide/" },
					{ text: "Quickstart", link: "/guide/quickstart" },
					{ text: "Take payments", link: "/guide/payments" },
					{ text: "Providers and routing", link: "/guide/providers" },
					{ text: "Access control", link: "/guide/access" },
				],
			},
			{
				text: "Production",
				items: [
					{ text: "Going to production", link: "/guide/go-live" },
					{ text: "Configuration", link: "/guide/configuration" },
				],
			},
			{
				text: "Extend with Go",
				items: [
					{ text: "Go package", link: "/library/" },
					{ text: "Hooks", link: "/library/hooks" },
					{
						text: "Build a provider adapter",
						link: "/library/providers",
					},
				],
			},
			{
				text: "Reference",
				items: [
					{ text: "HTTP API", link: "/api/conventions" },
					{ text: "OpenAPI explorer", link: "/api-reference" },
				],
			},
		],

		search: { provider: "local" },
		editLink: {
			pattern:
				"https://github.com/momobasehq/momobasehq.github.io/edit/main/:path",
		},
		socialLinks: [
			{ icon: "github", link: "https://github.com/momobasehq" },
			{ icon: "npm", link: "https://www.npmjs.com/package/momobase" },
			{
				icon: "linkedin",
				link: "https://www.linkedin.com/company/momobase",
			},
		],
		footer: {
			message:
				'Released under the MIT License. Inspired by <a href="https://pocketbase.io">PocketBase</a>.',
			copyright:
				'Created by <a href="https://github.com/henryhale">Henry Hale</a> @ <a href="https://github.com/momobasehq">MomobaseHQ</a>',
		},
		outline: { level: [2, 3] },
	},
});
