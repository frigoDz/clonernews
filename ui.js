// Everything that builds or updates HTML elements lives here.

import { fetchItems } from "./api.js";

// Convert a Unix timestamp into a "2h ago" style string
function timeAgo(timestamp) {
  const minutes = Math.floor((Date.now() / 1000 - timestamp) / 60);
  if (minutes < 60)   return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}


function getPostType(item) {
  if (item.type === "job")  return "job";
  if (item.type === "poll") return "poll";
  return "story";
}

// Build and return a post card element
export function createPostElement(item) {
  const type = getPostType(item);
  const url  = item.url || `https://news.ycombinator.com/item?id=${item.id}`;

  const card = document.createElement("div");
  card.className = "post-card";
  card.innerHTML = `
    <div class="post-header">
      <span class="badge ${type}">${type.toUpperCase()}</span>
      <span class="meta">by ${item.by || "?"} · ${timeAgo(item.time)}</span>
    </div>
    <h3><a href="${url}" target="_blank">${item.title || "(no title)"}</a></h3>
    ${item.text ? `<p class="post-text">${item.text.slice(0, 200)}…</p>` : ""}
    <div class="post-footer">
      <span>▲ <span class="score-val">${item.score || 0}</span> points</span>
      ${type === "poll"
        ? `<button class="extra-btn" data-id="${item.id}" data-kind="poll">📊 Poll Options</button>`
        : ""}
      ${item.descendants != null
        ? `<button class="extra-btn" data-id="${item.id}" data-kind="comments">💬 <span class="comments-val">${item.descendants}</span> Comments</button>`
        : ""}
    </div>
    <div class="extra-box" id="extra-${item.id}" style="display:none;"></div>
  `;

  // Attach click listeners to the Poll / Comments buttons
  card.querySelectorAll(".extra-btn").forEach(btn => {
    btn.addEventListener("click", () => toggleExtra(item, btn));
  });

  return card;
}

// Update score and comment count on a card that's already on the page
export function updatePostElement(id, item) {
  const card = document.querySelector(`[data-item-id="${id}"]`);
  if (!card) return;

  const scoreEl    = card.querySelector(".score-val");
  const commentsEl = card.querySelector(".comments-val");
  const titleLink  = card.querySelector("h3 a");

  if (scoreEl)    scoreEl.textContent    = item.score || 0;
  if (commentsEl) commentsEl.textContent = item.descendants || 0;
  if (titleLink && item.title) titleLink.textContent = item.title;

  // Flash yellow briefly so the user notices the update
  card.style.transition = "background 0.4s";
  card.style.background = "#fffbe6";
  setTimeout(() => { card.style.background = ""; }, 1200);
}

// Show or hide the extra box (comments or poll options) under a post
async function toggleExtra(item, btn) {
  const box = document.getElementById(`extra-${item.id}`);
  const isOpen = box.style.display === "block";

  // If already open, close it
  if (isOpen) {
    box.style.display = "none";
    btn.classList.remove("active");
    return;
  }

  // Open it
  box.style.display = "block";
  btn.classList.add("active");

  // Only load content the first time
  if (box.dataset.loaded) return;
  box.dataset.loaded = "true";

  if (btn.dataset.kind === "poll") {
    await loadPollOptions(item, box);
  } else {
    await loadComments(item.id, item.kids, box);
  }
}

// Load and display poll vote options
async function loadPollOptions(item, box) {
  if (!item.parts || item.parts.length === 0) {
    box.innerHTML = "<p>No poll options found.</p>";
    return;
  }

  const options = await fetchItems(item.parts);
  // Sort options by votes (highest first)
  options.sort((a, b) => (b.score || 0) - (a.score || 0));

  box.innerHTML = options.map(opt => `
    <div class="poll-option">
      <span>${opt.text || ""}</span>
      <span class="poll-score">▲ ${opt.score || 0}</span>
    </div>
  `).join("");
}

// Load and display comments for a post (newest first)
async function loadComments(postId, kidIds, box) {
  if (!kidIds || kidIds.length === 0) {
    box.innerHTML = "<p>No comments yet.</p>";
    return;
  }

  box.innerHTML = "<p>Loading comments…</p>";
  const comments = await fetchItems(kidIds);

  // Sort newest → oldest (higher time = newer; fall back to id if time missing)
  comments.sort((a, b) => (b.time ?? b.id ?? 0) - (a.time ?? a.id ?? 0));

  box.innerHTML = "";
  comments.forEach(comment => box.appendChild(buildComment(comment, postId)));
}

// Build one comment element (supports nested replies)
function buildComment(comment, postId) {
  const div = document.createElement("div");
  div.className = "comment";
  div.dataset.parentPost = postId; // stores which post this comment belongs to

  div.innerHTML = `
    <div class="comment-meta">
      <strong>${comment.by || "[deleted]"}</strong>
      · ${timeAgo(comment.time || 0)}
      · <em>post #${postId}</em>
    </div>
    <div class="comment-body">${comment.text || ""}</div>
    ${comment.kids && comment.kids.length
      ? `<button class="reply-btn">▶ ${comment.kids.length} replies</button>
         <div class="replies" style="display:none;"></div>`
      : ""}
  `;

  // Load replies when the button is clicked
  const replyBtn = div.querySelector(".reply-btn");
  if (replyBtn) {
    replyBtn.addEventListener("click", async () => {
      const repliesBox = div.querySelector(".replies");

      // Toggle: hide if already open
      if (repliesBox.style.display === "block") {
        repliesBox.style.display = "none";
        replyBtn.textContent = `▶ ${comment.kids.length} replies`;
        return;
      }

      replyBtn.textContent = "Loading…";
      const replies = await fetchItems(comment.kids);
      replies.sort((a, b) => (b.time ?? b.id ?? 0) - (a.time ?? a.id ?? 0));

      repliesBox.innerHTML = "";
      replies.forEach(reply => repliesBox.appendChild(buildComment(reply, postId)));
      repliesBox.style.display = "block";
      replyBtn.textContent = "▼ Hide replies";
    });
  }

  return div;
}
