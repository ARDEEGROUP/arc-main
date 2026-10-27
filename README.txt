ARDEE RACQUET CLUB: STATIC SITE

PAGES (clean URLs, no .html)
/            home            index.html
/gurugram    gurugram/index.html
/play        play/index.html
/membership  membership/index.html
/wellness    wellness/index.html
/events      events/index.html
/locations   locations/index.html
/enquire     enquire/index.html

FOLDERS
assets/css   base.css (every page) + home, sport, membership, forms, locations (only where used)
assets/js    config.js (EDIT THIS: WhatsApp numbers, Sheet URL, Circle date), core.js (every page),
             hours.js, membership.js, forms.js (only where used)
assets/img   optional photos: rooftop-pickleball.jpg, club-table.jpg, dupr-night.jpg, campus-aerial.jpg,
             dome.jpg, walking-track.jpg, turf.jpg, table-tennis.jpg, gym.jpg, reformer.jpg,
             nfc.jpg, goa.jpg, map.jpg  (missing files simply show the green/terracotta gradient)

PREVIEW LOCALLY
python3 serve.py     then open http://localhost:8000/play
(Double-clicking an html file will not work: links and assets start with "/" and need a server.)

DEPLOY
Netlify / Vercel / Cloudflare Pages: upload the folder; /play works (vercel.json and netlify.toml included).
Apache: upload everything including .htaccess. Nginx: add  location / { try_files $uri $uri/index.html $uri/ =404; }

Add a new page (e.g. /about): create about/index.html, copy another page for the header/footer, add a link.
