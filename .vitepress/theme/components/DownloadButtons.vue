<script setup lang="ts">
import { onMounted, ref } from "vue";
import { apple, linux, windows } from "./os-icons";

// Release assets are named momobase_<tag>_<os>_<arch>.zip, so the version is part of
// every filename and /releases/latest/download/<name> cannot resolve. Ask the API for
// the current tag instead, which also keeps this page correct without a docs change
// on every release.
const REPO = "momobasehq/server";
const RELEASES = `https://github.com/${REPO}/releases`;
const ARCHES = ["amd64", "arm64"];
const PLATFORMS = [
	{ id: "darwin", label: "macOS", icon: apple },
	{ id: "linux", label: "Linux", icon: linux },
	{ id: "windows", label: "Windows", icon: windows },
];

type Build = { arch: string; url: string };
type Platform = { id: string; label: string; icon: string; builds: Build[] };

const version = ref("");
const checksums = ref("");
const platforms = ref<Platform[]>([]);

onMounted(async () => {
	try {
		const response = await fetch(
			`https://api.github.com/repos/${REPO}/releases/latest`,
			{ headers: { Accept: "application/vnd.github+json" } },
		);
		if (!response.ok) return;

		const release = await response.json();
		const urls = new Map<string, string>(
			release.assets.map((asset) => [
				asset.name,
				asset.browser_download_url,
			]),
		);

		const found = PLATFORMS.map((platform) => ({
			...platform,
			builds: ARCHES.map((arch) => ({
				arch,
				url: urls.get(
					`momobase_${release.tag_name}_${platform.id}_${arch}.zip`,
				),
			})).filter((build): build is Build => Boolean(build.url)),
		})).filter((platform) => platform.builds.length > 0);

		if (found.length === 0) return;

		version.value = release.tag_name;
		checksums.value = urls.get("SHA256SUMS") ?? "";
		platforms.value = found;
	} catch {
		// Offline, rate limited, or blocked: the fallback link below still stands.
	}
});
</script>

<template>
	<div class="downloads">
		<div v-if="platforms.length" class="downloads-grid">
			<div
				v-for="platform in platforms"
				:key="platform.id"
				class="downloads-platform"
			>
				<div class="downloads-name">
					<svg
						class="downloads-icon"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path :d="platform.icon" />
					</svg>
					{{ platform.label }}
				</div>
				<a
					v-for="build in platform.builds"
					:key="build.arch"
					class="downloads-button"
					:href="build.url"
					:aria-label="`Download Momobase Server ${version} for ${platform.label} ${build.arch}`"
				>
					<svg
						class="downloads-arrow"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							d="m8 12 4 4 4-4"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M12 16V4M19 17v.6c0 1.33-1.07 2.4-2.4 2.4H7.4C6.07 20 5 18.93 5 17.6V17"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-miterlimit="10"
							stroke-linecap="round"
						/>
					</svg>
					{{ build.arch }}
				</a>
			</div>
		</div>

		<p class="downloads-note">
			<template v-if="version">
				Momobase Server {{ version }} &middot;
				<a v-if="checksums" :href="checksums">SHA256SUMS</a>
				<template v-if="checksums"> &middot; </template>
			</template>
			<a :href="RELEASES">All releases</a>
		</p>
	</div>
</template>

<style scoped>
.downloads {
	margin: 24px 0;
}

.downloads-grid {
	display: flex;
	gap: 12px;
	flex-direction: column;
}

.downloads-platform {
	align-items: center;
	background-color: var(--vp-c-bg-soft);
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	display: flex;
	gap: 8px;
	padding: 14px 16px;
}

.downloads-name {
	align-items: center;
	display: flex;
	flex: 1;
	font-weight: 600;
	gap: 8px;
}

.downloads-icon {
	fill: currentcolor;
	height: 20px;
	width: 20px;
}

.downloads-button {
	align-items: center;
	background-color: var(--vp-c-bg);
	border: 1px solid var(--vp-c-border);
	border-radius: 6px;
	color: var(--vp-c-text-1);
	display: inline-flex;
	font-size: 13px;
	font-weight: 600;
	gap: 4px;
	padding: 4px 10px 4px 8px;
	text-decoration: none;
	transition:
		background-color 0.2s,
		border-color 0.2s;
}

.downloads-button:hover {
	background-color: var(--vp-c-bg-soft);
}

.downloads-arrow {
	fill: none;
	height: 16px;
	width: 16px;
}

.downloads-note {
	color: var(--vp-c-text-2);
	font-size: 14px;
	margin-top: 12px;
}
</style>
