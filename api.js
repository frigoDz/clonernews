const BASE_URL = "https://hacker-news.firebaseio.com/v0"
const cache = {}
export async function fetchIds(type) {
  try {
    if (type === "toppolls") {
      const res = await fetch("https://hn.algolia.com/api/v1/search_by_date?tags=poll&hitsPerPage=50")
      const data = await res.json()
      return data.hits.map(h => Number(h.objectID))
    }

    const res = await fetch(`${BASE_URL}/${type}.json`)
    return await res.json()
  } catch (err) {
    console.error("fetchIds failed:", err)
    return []
  }
}
export async function fetchItem(id, skipCache = false) {
  if (!skipCache && cache[id]) return cache[id]
  try {
    const res = await fetch(`${BASE_URL}/item/${id}.json`)
    const item = await res.json()
    if (item) cache[id] = item
    return item
  } catch (err) {
    console.error("fetchItem failed:", err)
    return null
  }
}
export async function fetchItems(ids) {
  const items = await Promise.all(ids.map(id => fetchItem(id)))
  return items.filter(item => item && !item.deleted && !item.dead)
}
