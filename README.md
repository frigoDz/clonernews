# HackerNews Reader
 
A simple web app that displays posts from Hacker News (stories, jobs, and polls).
 
---
 
## Files
 
| File | What it does |
|---|---|
| `index.html` | The page structure (header, nav, feed) |
| `style.css` | All the styling |
| `api.js` | Fetches data from the Hacker News API |
| `ui.js` | Builds and updates the HTML cards |
| `init.js` | Starts the app, loads posts, handles scroll and live updates |
 
---
 
## How to run
 
1. Download or clone the project
2. Open `index.html` in a browser
> ⚠️ Must be served via a local server (not opened as a file) because it uses JS modules.
 
**Quick option — VS Code:**
Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html` → **Open with Live Server**
 
**Quick option — terminal:**
```bash
npx serve .
```
Then open `http://localhost:3000`
---
you can alos do `https://clonernews.netlify.app`
 
## Features
 
- Browse **Stories**, **Jobs**, and **Polls**
- Click **Comments** to expand comments under a post (newest first)
- Click **Poll Options** to see poll results
- Scroll down to **load more posts** automatically
- **Live updates** every 5 seconds — a notification appears if posts change
---
 
## Contributors
 
| Name | GitHub | Files |
|---|---|---|
| hzmarrou | [@frigoDz](https://github.com/ayoussfi605-crypto) | `api.js`, `init.js` |
| aelyoussef | [@ayoussfi605-crypto](https://github.com/frigoDz) | `index.html`, `style.css`, `ui.js` |

