---
layout: page
sidebar: false
aside: false
footer: false
lastUpdated: false
editLink: false
---

<script setup>
import { ApiReference } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'
</script>

<ClientOnly>
	<ApiReference :configuration="{ url: '/momobase/swagger.json', favicon: '/logo.svg', telemetry: false, showDeveloperTools: 'never' }" />
</ClientOnly>
