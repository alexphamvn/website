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

## How to view it

Double-click `index.html`. It opens in your browser. Click the nav links at the top to move between pages.

## How to edit it

1. Open any `.html` file in a text editor (TextEdit, Notepad, VS Code, etc.)
2. Look for comments that say `[EDIT: ...]` — those mark every section meant to be customized
3. Replace placeholder text (like `Your Name`, `[University]`, `[Journal Name]`) with your real info
4. Save the file, then refresh your browser

## Common edits

### Add your photo
In `index.html`, find the gray `[ Your photo goes here ]` box and replace it with:
```html
<img src="your-photo.jpg" alt="Your name" class="hero-photo" style="object-fit:cover;" />
```
Then put `your-photo.jpg` in the same folder.

### Embed your CV
Put your CV PDF in this folder and rename it `cv.pdf`. It will automatically show up on the CV page.

### Add a new publication
In `research.html`, copy any `<div class="pub">...</div>` block, paste it below the others, and edit the text. Update the `[1]`, `[2]` numbers.

### Change colors site-wide
Open `style.css` and edit the values at the very top (under `:root`). Change one variable there and it updates every page.

### Change the navigation menu
The nav bar appears on every page. If you add or rename a link, you'll need to update it in all 6 HTML files (it's the `<nav class="topnav">` block near the top of each).

## Putting it online (optional)

When you're ready to publish:
- **Easiest:** drag the whole folder into [Netlify Drop](https://app.netlify.com/drop) — free, takes 30 seconds
- **GitHub Pages:** upload the folder to a GitHub repo and enable Pages in settings
- **University server:** ask your IT department for hosting space (usually free for students)
