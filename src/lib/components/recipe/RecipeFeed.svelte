<script>
	import { goto, invalidateAll } from '$app/navigation'
	import { navigating } from '$app/state'
	import { sortByDate, sortByKeyGeneric } from '$lib/utils/sorting'
	import RecipeFilter from '$lib/components/recipe/RecipeFilter.svelte'
	import RecipeList from '$lib/components/recipe/RecipeList.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import CopyRecipeDialog from '$lib/components/recipe/CopyRecipeDialog.svelte'
	import { duplicateRecipe } from '$lib/utils/crud'
	import { t } from '$lib/stores/locale.js'
	import {
		sortState,
		searchString,
		searchFields,
		cookedFilter,
		favouriteFilter
	} from '$lib/stores/recipeFilter'

	/** @type {{recipes?: any[], viewMode?: 'owner' | 'social', title?: string | null, viewerUserId?: string | null, ownerUserId?: string | null, ownerUsername?: string | null, feedKind?: 'all' | 'user', semanticEnabled?: boolean}} */
	let {
		recipes = [],
		viewMode = 'owner',
		title = null,
		viewerUserId = null,
		ownerUserId = null,
		ownerUsername = null,
		feedKind = 'user',
		semanticEnabled = false
	} = $props()

	let filteredRecipes = $state([])
	let isLoading = $state(true)
	let isCopying = $state(false)
	let copyDialogOpen = $state(false)
	let copiedRecipe = $state(null)
	let pendingCopyUid = $state(null)
	let copyMessage = $state(null)
	let copyMessageCode = $state(null)
	let semanticScores = $state(new Map())
	let semanticRuntimeEnabled = $state(!!semanticEnabled)
	let semanticSearchPending = $state(false)
	let semanticRequestId = 0
	let isNavigating = $derived(!!navigating?.to)
	let searchPending = $derived(isLoading || semanticSearchPending)

	function includesQueryAcrossRecipe(recipe, query) {
		const q = query?.toLowerCase?.().trim?.()
		if (!q) return false

		const searchable = [
			recipe?.name,
			recipe?.description,
			recipe?.ingredients,
			recipe?.directions,
			recipe?.notes,
			recipe?.source
		]
			.filter(Boolean)
			.join('\n')
			.toLowerCase()

		return searchable.includes(q)
	}

	function applyManualSort(recipeList, key, direction) {
		if (!key || !direction) return recipeList
		if (key === 'created') return sortByDate(recipeList, 'created', direction)
		if (key === 'lastCooked') {
			return [...recipeList].sort((a, b) => {
				const aMax = a.log?.length
					? Math.max(...a.log.map((l) => new Date(l.cooked).getTime()))
					: -Infinity
				const bMax = b.log?.length
					? Math.max(...b.log.map((l) => new Date(l.cooked).getTime()))
					: -Infinity
				return direction === 'desc' ? bMax - aMax : aMax - bMax
			})
		}
		return sortByKeyGeneric(recipeList, key, direction)
	}

	function matchesSelectedFields(recipe, query, fields) {
		if (!query || !fields?.length) return false
		const q = query.toLowerCase()
		return fields.some((field) => {
			const value = recipe?.[field]?.toString?.().toLowerCase?.() || ''
			return value.includes(q)
		})
	}

	function scoreRecipeScoped(recipe, query, fields) {
		const q = query?.toLowerCase?.().trim?.()
		if (!q || !fields?.length) return 0

		let score = 0
		for (const field of fields) {
			const value = recipe?.[field]?.toString?.().toLowerCase?.() || ''
			if (!value) continue
			if (value === q) score += 100
			else if (value.startsWith(q)) score += 60
			else if (value.includes(q)) score += 35
		}
		return score
	}

	function scoreRecipeGlobal(recipe, query) {
		const q = query?.toLowerCase?.().trim?.()
		if (!q) return 0

		const nameText = recipe?.name?.toString?.().toLowerCase?.() || ''
		const broadMatch = includesQueryAcrossRecipe(recipe, q)
		const semanticScore = semanticScores.get(recipe.uid) || 0

		let score = 0
		if (nameText === q) score += 90
		else if (nameText.startsWith(q)) score += 60
		else if (nameText.includes(q)) score += 35

		if (broadMatch) score += 30
		score += semanticScore * 100

		return score
	}

	$effect(() => {
		semanticRuntimeEnabled = !!semanticEnabled
	})

	function handleRecipeFavourited(uid, nextState, recipeItem) {
		if (
			feedKind === 'user' &&
			recipeItem?.userId &&
			recipeItem.userId !== viewerUserId &&
			!nextState
		) {
			recipes = recipes.filter((recipe) => recipe.uid !== uid)
			return
		}

		recipes = recipes.map((recipe) =>
			recipe.uid === uid ? { ...recipe, on_favorites: nextState } : recipe
		)
	}

	function handleRecipeRatingChanged(uid, newRating) {
		recipes = recipes.map((recipe) =>
			recipe.uid === uid ? { ...recipe, rating: newRating } : recipe
		)
	}

	async function handleDuplicateRequested(uid) {
		if (!viewerUserId) return
		if (isCopying) return
		pendingCopyUid = uid
		copiedRecipe = null
		copyMessage = null
		copyMessageCode = null
		copyDialogOpen = true
	}

	async function runDuplicate(action = 'stay') {
		if (isCopying) return
		if (!pendingCopyUid) return

		copyDialogOpen = false
		isCopying = true
		const result = await duplicateRecipe(pendingCopyUid)
		if (!result.success || !result.uid) {
			isCopying = false
			pendingCopyUid = null
			copyMessage = result.error || null
			copyMessageCode = result.code || 'recipe.msg.duplicateFail'
			copyDialogOpen = true
			return
		}
		await invalidateAll()

		try {
			const response = await fetch(`/api/recipe/${result.uid}`)
			if (response.ok) {
				copiedRecipe = await response.json()
			}
		} catch (err) {
			console.error('Failed to load duplicated recipe:', err)
		}

		isCopying = false
		pendingCopyUid = null
		copyMessageCode = null

		if (action === 'view') {
			handleCopyView()
			return
		}

		handleCopyStay()
	}

	function handleCopyCancel() {
		copyDialogOpen = false
		pendingCopyUid = null
		copiedRecipe = null
		copyMessage = null
		copyMessageCode = null
	}

	function handleCopyStay() {
		copyDialogOpen = false
		if (feedKind === 'all' && copiedRecipe) {
			recipes = [copiedRecipe, ...recipes]
		}
		copiedRecipe = null
		copyMessage = null
		copyMessageCode = null
	}

	function handleCopyView() {
		if (!copiedRecipe?.uid) return
		const targetUid = copiedRecipe.uid
		copyDialogOpen = false
		pendingCopyUid = null
		copiedRecipe = null
		copyMessage = null
		copyMessageCode = null
		invalidateAll().then(() => goto(`/recipe/${targetUid}/view/`))
	}

	$effect(() => {
		isLoading = true

		const recipeList = Array.isArray(recipes) ? recipes : []

		// Prevent rating sorting in social mode
		if (viewMode !== 'owner' && $sortState.key === 'rating') {
			sortState.set({ key: null, direction: null })
		}

		const manualSortEnabled = !!$sortState.key && !!$sortState.direction
		const trimmedQuery = $searchString?.trim() || ''
		const hasSearchQuery = trimmedQuery.length > 0
		const selectedFields = $searchFields || []
		const hasScopedFields = selectedFields.length > 0

		// Base order: most recent first (no search). If searching with no manual sort,
		// relevance ranking takes over below.
		const baseRecipes = hasSearchQuery
			? recipeList
			: applyManualSort(
					recipeList,
					manualSortEnabled ? $sortState.key : 'created',
					manualSortEnabled ? $sortState.direction : 'desc'
				)

		let categoryFilteredRecipes = baseRecipes

		// Filtering by cooked status (owner only)
		if (viewMode === 'owner' && $cookedFilter) {
			categoryFilteredRecipes = categoryFilteredRecipes
				.filter((recipe) => recipe.log.length > 0)
				.sort((a, b) => {
					const cooksDiff = b.log.length - a.log.length
					if (cooksDiff !== 0) return cooksDiff
					return (a.name || '').localeCompare(b.name || '')
				})
		}

		// Filtering by favourite status
		if ($favouriteFilter) {
			categoryFilteredRecipes = categoryFilteredRecipes.filter(
				(recipe) => recipe.on_favorites === true
			)
		}

		if (!hasSearchQuery) {
			filteredRecipes = categoryFilteredRecipes
		} else if (hasScopedFields) {
			// Field-scoped mode: fuzzy/text only over selected fields (no semantic).
			let searchResults = categoryFilteredRecipes.filter((recipe) =>
				matchesSelectedFields(recipe, trimmedQuery, selectedFields)
			)
			if (manualSortEnabled) {
				searchResults = applyManualSort(searchResults, $sortState.key, $sortState.direction)
			} else {
				searchResults = searchResults
					.map((recipe, index) => ({
						recipe,
						score: scoreRecipeScoped(recipe, trimmedQuery, selectedFields),
						index
					}))
					.sort((a, b) => {
						if (b.score !== a.score) return b.score - a.score
						return (
							new Date(b.recipe.created).getTime() - new Date(a.recipe.created).getTime() ||
							a.index - b.index
						)
					})
					.map((entry) => entry.recipe)
			}
			filteredRecipes = searchResults
		} else {
			// Default mode (no selected fields): semantic + fuzzy/hybrid relevance.
			const broadMatchIds = new Set(
				categoryFilteredRecipes
					.filter((recipe) => includesQueryAcrossRecipe(recipe, trimmedQuery))
					.map((recipe) => recipe.uid)
			)
			let searchResults = categoryFilteredRecipes.filter(
				(recipe) => broadMatchIds.has(recipe.uid) || semanticScores.has(recipe.uid)
			)
			if (manualSortEnabled) {
				searchResults = applyManualSort(searchResults, $sortState.key, $sortState.direction)
			} else {
				searchResults = searchResults
					.map((recipe, index) => ({
						recipe,
						score: scoreRecipeGlobal(recipe, trimmedQuery),
						index
					}))
					.sort((a, b) => {
						if (b.score !== a.score) return b.score - a.score
						return (
							new Date(b.recipe.created).getTime() - new Date(a.recipe.created).getTime() ||
							a.index - b.index
						)
					})
					.map((entry) => entry.recipe)
			}
			filteredRecipes = searchResults
		}

		setTimeout(() => {
			isLoading = false
		}, 0)
	})

	$effect(() => {
		if (
			!semanticRuntimeEnabled ||
			!$searchString ||
			$searchString.length < 4 ||
			($searchFields || []).length > 0
		) {
			semanticRequestId += 1
			semanticSearchPending = false
			semanticScores = new Map()
			return
		}

		const requestId = semanticRequestId + 1
		semanticRequestId = requestId
		semanticSearchPending = true

		const timeout = setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/recipe/search?q=${encodeURIComponent($searchString)}&mode=semantic&limit=80`
				)

				if (!response.ok) {
					semanticScores = new Map()
					if (requestId === semanticRequestId) semanticSearchPending = false
					return
				}

				const data = await response.json()
				if (!data.enabled) {
					semanticRuntimeEnabled = false
					semanticScores = new Map()
					if (requestId === semanticRequestId) semanticSearchPending = false
					return
				}

				semanticScores = new Map((data.results || []).map((result) => [result.uid, result.score]))
			} catch (error) {
				console.error('Semantic search request failed:', error)
				semanticScores = new Map()
			} finally {
				if (requestId === semanticRequestId) {
					semanticSearchPending = false
				}
			}
		}, 500)

		return () => clearTimeout(timeout)
	})
</script>

{#if title}
	<div class="mb-2 md:mb-4 prose max-w-none flex justify-center">
		<h2>{title}</h2>
	</div>
{:else if viewMode === 'social' && ownerUsername}
	<div class="mb-2 md:mb-4 prose max-w-none flex justify-center">
		<h2>{$t('nav.cookbook', { username: ownerUsername })}</h2>
	</div>
{/if}

<div class="transition-all duration-300">
	<RecipeFilter viewOnly={false} username={ownerUsername} {viewMode} {searchPending} />
	<Spinner visible={isLoading || isNavigating} spinnerContent={$t('common.loading')} />
	<RecipeList
		{filteredRecipes}
		{viewMode}
		{viewerUserId}
		recipeFavourited={handleRecipeFavourited}
		recipeRatingChanged={handleRecipeRatingChanged}
		onDuplicate={handleDuplicateRequested}
	/>
</div>

<CopyRecipeDialog
	bind:isOpen={copyDialogOpen}
	onCancel={handleCopyCancel}
	onStay={() => runDuplicate('stay')}
	onView={() => runDuplicate('view')}
	viewDisabled={false}
	message={copyMessage}
	messageCode={copyMessageCode}
/>

<Spinner visible={isCopying} spinnerContent={$t('copyDialog.copying')} />
