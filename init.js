import { fetchIds, fetchItem } from "./api.js"
import { createPostElement, updatePostElement } from "./ui.js"
const BATCH_SIZE    = 10
const LIVE_INTERVAL = 5000
let allIds       = []
let loadedCount  = 0
let currentFeed  = "newstories"
let isLoading    = false
let liveTimer    = null
let snapshots    = {}
const feed   = document.getElementById("feed")
const loader = document.getElementById("loader")
const toast  = document.getElementById("toast")
async function init(type) {
  currentFeed = type
  loadedCount = 0
  allIds      = []
  isLoading   = false
  snapshots   = {}
  feed.innerHTML = ""
  toast.classList.add("hidden")
  if (liveTimer) clearInterval(liveTimer)
  document.querySelectorAll("nav button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.feed === type)
  })
  loader.style.display = "block"
  allIds = await fetchIds(type)
  if (!Array.isArray(allIds)) allIds = []
  if (allIds.length === 0) {
    loader.style.display = "none"
    feed.innerHTML = "<p class='empty-msg'>No posts found.</p>"
    return
  }
  await loadNextBatch()
  startLiveUpdates()
}
async function loadNextBatch() {
  if (isLoading || loadedCount >= allIds.length) return;
  isLoading = true;
  loader.style.display = "block";
  const batchIds = allIds.slice(loadedCount, loadedCount + BATCH_SIZE)
  try {
    const items = await Promise.all(batchIds.map(id => fetchItem(id)))
    items.forEach(item => {
      if (!item || item.deleted || item.dead) return
      const card = createPostElement(item)
      card.dataset.itemId = String(item.id)
      feed.appendChild(card)
      snapshots[item.id] = {
        score:       item.score       || 0,
        descendants: item.descendants || 0,
        title:       item.title       || ""
      }
    })

    loadedCount += BATCH_SIZE
  } catch (err) {
    feed.insertAdjacentHTML("beforeend", "<p class='error-msg'>Failed to load posts. Please try again.</p>")
  }
  isLoading = false
  loader.style.display = "none"
  if (loadedCount >= allIds.length && !document.getElementById("end-msg")) {
    const endMsg = document.createElement("p")
    endMsg.id        = "end-msg"
    endMsg.className = "empty-msg"
    endMsg.textContent = "You've reached the end."
    feed.appendChild(endMsg)
  }
}
window.addEventListener("scroll", throttle(() => {
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 400
  if (nearBottom) loadNextBatch()
}, 200))
function throttle(fn, ms) {
  let lastRun = 0
  return function () {
    const now = Date.now()
    if (now - lastRun >= ms) {
      lastRun = now
      fn()
    }
  }
}
function startLiveUpdates() {
  liveTimer = setInterval(async () => {
    const latestIds = await fetchIds(currentFeed)
    if (!Array.isArray(latestIds)) return
    const newCount = latestIds.filter(id => !allIds.includes(id)).length
    const visibleIds = Object.keys(snapshots).map(Number).slice(0, 20)
    let updatedCount = 0
    for (const id of visibleIds) {
      const item = await fetchItem(id, true)
      if (!item || item.deleted || item.dead) continue

      const prev = snapshots[id]
      const hasChanged =
        (item.score       || 0) !== prev.score       ||
        (item.descendants || 0) !== prev.descendants ||
        (item.title       || "") !== prev.title

      if (hasChanged) {
        updatedCount++
        snapshots[id] = { score: item.score || 0, descendants: item.descendants || 0, title: item.title || "" }
        updatePostElement(id, item)
      }
    }
    if (newCount > 0 || updatedCount > 0) {
      const parts = []
      if (newCount)    parts.push(`${newCount} new post${newCount > 1 ? "s" : ""}`)
      if (updatedCount) parts.push(`${updatedCount} updated`)
      toast.textContent = `🔔 ${parts.join(" · ")} — click to refresh`
      toast.classList.remove("hidden")
      toast.onclick = () => init(currentFeed)
    }

  }, LIVE_INTERVAL)
}
window.switchFeed = init
init("newstories")
