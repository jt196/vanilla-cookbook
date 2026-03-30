export const BOOKMARKLET_WINDOW_NAME_PREFIX = 'vanilla-cookbook-import:'

/**
 * Build bookmarklet code that forwards both the current URL and captured page text.
 *
 * @param {string} baseUrl
 * @returns {string}
 */
export function buildBookmarkletCode(baseUrl) {
	const encodedBaseUrl = JSON.stringify(baseUrl)
	const encodedPrefix = JSON.stringify(BOOKMARKLET_WINDOW_NAME_PREFIX)

	return `javascript:(function(){var baseUrl=${encodedBaseUrl};var prefix=${encodedPrefix};var selectedText='';try{selectedText=String(window.getSelection?window.getSelection():'').trim();}catch(e){}var bodyText=document.body&&document.body.innerText?document.body.innerText:'';var text=(selectedText||bodyText||'').replace(/\\s+\\n/g,'\\n').replace(/\\n{3,}/g,'\\n\\n').trim().slice(0,120000);var payload={url:window.location.href,title:document.title||'',text:text};var target=window.open('about:blank','_blank');if(!target){window.location.href=baseUrl+'/recipe/new?url='+encodeURIComponent(payload.url);return;}target.name=prefix+encodeURIComponent(JSON.stringify(payload));target.location=baseUrl+'/recipe/new?url='+encodeURIComponent(payload.url)+'&bookmarklet=1';})();`
}

/**
 * Read bookmarklet payload from window.name.
 *
 * @param {Window} currentWindow
 * @returns {{ url?: string, title?: string, text?: string }|null}
 */
export function readBookmarkletPayload(currentWindow) {
	const rawName = currentWindow?.name
	if (!rawName || !rawName.startsWith(BOOKMARKLET_WINDOW_NAME_PREFIX)) return null

	try {
		const encodedPayload = rawName.slice(BOOKMARKLET_WINDOW_NAME_PREFIX.length)
		const payload = JSON.parse(decodeURIComponent(encodedPayload))
		currentWindow.name = ''
		return payload && typeof payload === 'object' ? payload : null
	} catch {
		return null
	}
}
