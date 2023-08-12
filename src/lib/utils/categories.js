export function buildHierarchy(categories) {
	const map = {}
	categories.forEach((cat) => (map[cat.uid] = { ...cat, children: [] }))

	const roots = []
	categories.forEach((cat) => {
		if (cat.parent_uid) {
			map[cat.parent_uid].children.push(map[cat.uid])
		} else {
			roots.push(map[cat.uid])
		}
	})

	return roots
}
