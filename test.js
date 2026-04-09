const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
dom.window.document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM LOADED!");
});
dom.window.addEventListener('error', (event) => {
    console.log('UNCAUGHT ERROR:', event.error);
});
setTimeout(() => {
    console.log('DONE');
}, 3000)
