import { fetch } from "undici";
fetch('http://localhost:3000/api/read?url=https://lite.duckduckgo.com/lite/?q=ad%20blocker').then(async r => { console.log(r.status, await r.text().then(t => t.slice(0, 200))) }).catch(e => console.error(e));
