<script lang="ts">
	import type { PageData } from './$types'

	export let data: PageData
	$: ({ recipe } = data)
</script>

<h3>{recipe.name}</h3>

<p>
	Description:
	{recipe.description}
</p>
<p>
	Source:
	{recipe.source}
</p>
<p>
	Source URL:
	{recipe.source_url}
</p>

<a href="/recipe/edit/{recipe.uid}" role="button" class="outline contrast">Edit</a>
