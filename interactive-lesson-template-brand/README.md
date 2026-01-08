# Interactive Lesson Template (Editable in Dreamweaver)

This is a lightweight, static HTML/CSS/JS lesson template that you can edit monthly by changing **one file**:
- `content/lesson-data.js`

## Open locally
1. Unzip the folder.
2. Open `index.html` in Dreamweaver (or any editor).
3. Preview in a browser (Dreamweaver Live View, or double-click `index.html`).

> Note: Some browsers restrict local file loading in certain cases. If anything looks off,
run a tiny local server (recommended):
- VS Code: "Live Server" extension
- or Python: `python -m http.server 8000` then open http://localhost:8000

## Monthly updates (fast)
Edit: `content/lesson-data.js`
- Change titles, text, buttons, links
- Swap images/videos in `/media`
- Add/remove slides by editing the `LESSON.slides` array

## Hosting
Upload the folder contents to:
- Netlify / Vercel
- Your web host
- Amazon S3 (static website hosting)

## Customization points
- Branding: `css/style.css` (colors, fonts, logo)
- Layout behavior: `js/app.js` (navigation, rendering)


## Scrollable + animated format
This version renders as a **scrollable, animated lesson** (closer to the examples you shared):
- Sidebar links smoothly scroll to each section
- Sections fade/slide in as you scroll
- Completion/progress is tracked (and can be reset)


## Slide-like mode (scroll snapping + parallax)
- Desktop: scroll snaps between sections
- Subtle parallax background motion per section
- Sidebar jumps to slides
