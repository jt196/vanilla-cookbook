<script>
	/**
	 * The page data type.
	 * @typedef {Object} PageData
	 * @property {Object} article - The article data.
	 * @property {string} article.title - The title of the article.
	 * @property {string} article.content - The content of the article.
	 */

	/** @type {PageData} */
	export let data
	$: ({ article } = data)
</script>

<form action="?/updateArticle" method="POST">
	<h3>Editing: {article.title}</h3>
	<label for="title"> Title </label>
	<input type="text" id="title" name="title" value={article.title} />
	<label for="title"> Title </label>
	<textarea id="content" name="content" rows={5} value={article.content} />
	<button type="submit">Update Article</button>
</form>
