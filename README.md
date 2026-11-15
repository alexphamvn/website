# Your Personal Website

A simple multi-page academic website. No build tools, no servers — just open the files in a browser.

## Files in this folder

| File | What it is |
|------|-----------|
| `index.html` | Home / About page (this is the one to open first) |
| `research.html` | Research and publications |
| `teaching.html` | Courses you've taught + student testimonials |
| `experience.html` | Industry / project experience |
| `cv.html` | Embedded CV (PDF) viewer |
| `contact.html` | Contact info |
| `style.css` | All the design — colors, fonts, layout |
| `fx.js` | The moving parts shared by every page — night sky, film grain, nav underline, headings, the research-questions curve, dot fields |
| `badge.js` | The 3D lanyard badge on the home page |
| `research.js` | The particle figure on the research page |
| `cv.pdf` | Your CV (you add this) |
| `your-photo.jpg` | Your photo for the badge (you add this) |

## How to view it

Double-click `index.html`. It opens in your browser. Click the nav links at the top to move between pages.

## How to edit it

1. Open any `.html` file in a text editor (TextEdit, Notepad, VS Code, etc.)
2. Look for comments that say `[EDIT: ...]` — those mark every section meant to be customized
3. Replace placeholder text (like `Your Name`, `[University]`, `[Journal Name]`) with your real info
4. Save the file, then refresh your browser

## Common edits

### Add your photo
Put a portrait photo named `your-photo.jpg` in this folder. It appears on the badge on the home page. To use a different file name, change `data-photo` on `<div id="badge-3d">` in `index.html`.

### Embed your CV
Put your CV PDF in this folder and rename it `cv.pdf`. It will automatically show up on the CV page.

### Add a new publication
In `research.html`, copy any `<div class="pub">...</div>` block, paste it into the section it belongs to, and edit the text. Each block is authors, title, then one line per journal / status / conference. To add a link chip under a paper, add `<div class="pub-links"><a class="pub-link" href="https://…">Manuscript</a></div>` inside the block.

### Edit the research questions (home page)
In `index.html`, find `[EDIT: RESEARCH QUESTIONS]`. Change the two questions and the two stage names ("Emergence", "Dominance") — the curve redraws itself to fit the text.

### Edit courses and testimonials
In `teaching.html`, each `.teaching-row` is one course. To add a testimonial, copy a `<div class="testimonial">` block — the dots under the carousel are created automatically.

### Change colors site-wide
Open `style.css` and edit the values at the very top (under `:root`). Change one variable there and it updates every page.

### Change the navigation menu
The nav bar appears on every page. If you add or rename a link, you'll need to update it in all the HTML files (it's the `<nav class="topnav">` block near the top of each).

## Putting it online (optional)

When you're ready to publish:
- **Easiest:** drag the whole folder into [Netlify Drop](https://app.netlify.com/drop) — free, takes 30 seconds
- **GitHub Pages:** upload the folder to a GitHub repo and enable Pages in settings
- **University server:** ask your IT department for hosting space (usually free for students)

### The 3D lanyard badge (home page)
The home page has a night sky behind the whole page, with an interactive ID badge on a lanyard on the left and your introduction on the right — visitors can grab it, drag it and fling it. It's built with React Three Fiber + Rapier physics and lives in **`badge.js`** (already built, nothing to install).

- **Change the text on the card:** the name comes from the `[EDIT: NAME BOX]` section in `index.html`. The rest is set by attributes on `<div id="badge-3d">`: `data-role` is the wording running up the coloured strip, `data-former` is the job title under your name (put a `|` where a new line should start), and `data-photo` is the photo.
- **Fallback:** if a browser can't do 3D, the original name box shows instead.
- **Opening the file straight from your computer** (double-click) works, but browsers block the photo there, so the card shows your initials. On the live site the photo appears.
- **Changing the design itself:** the card faces (strip, layout, colours) were last changed directly in `badge.js`, so the source in `badge-src/` is behind. Rebuilding from `badge-src/` as it stands would bring back the old card design — update the source first.

### Motion and textures
Everything that moves outside the badge and the research figure lives in `fx.js`, in numbered blocks (sky, grain, nav underline, headings, curve, dots…). Each block is independent, so one can be deleted without breaking the others. Visitors whose device asks for reduced motion get a still version automatically.
