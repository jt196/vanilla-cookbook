export async function GET(request) {
	const imageUrl = request.url.searchParams.get('url')
	try {
		const response = await fetch(imageUrl, { method: 'HEAD' })

		return new Response(JSON.stringify({ exists: response.ok }), { status: 200 })
	} catch (error) {
		return new Response(JSON.stringify({ exists: false }), { status: 500 })
	}
}
