import { readdirSync, readFileSync } from 'fs';
const badgeFolder = '../output';
const badges = readdirSync(badgeFolder)

const perChunk = 8 // items per chunk

const pages = badges.reduce((pagesArray, item, index) => {
  const chunkIndex = Math.floor(index/perChunk)

  if(!pagesArray[chunkIndex]) {
    pagesArray[chunkIndex] = [] // start a new chunk
  }

  pagesArray[chunkIndex].push(item)

  return pagesArray
}, [])

const firstPartHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Badges</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: mono;
    }

    /* DIN A4, 8xbadges */
    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
      }
    }

    .page {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: repeat(4, 1fr);
      height: 297mm;
      gap: 0mm;
      width: 210mm;
      padding: 8mm 0 9mm;
      box-sizing: border-box;
    }
    .badge {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 16px;
      padding: 0mm;
      box-sizing: border-box;
      background-color: hotpink;
    }

    /* Optional: bessere Druckqualität */
    .badge img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>`
console.log(firstPartHTML);

pages.forEach(page => {
  console.log('<div class="page">');
  page.forEach(badge => {
    console.log('<div class="badge">');
    console.log(readFileSync(`../output/${badge}`, { encoding: 'utf8', flag: 'r' }));
    console.log('</div>');
  })
  console.log('</div>')
});
const thirdPartHTML = `
</body>
</html>
`;
console.log(thirdPartHTML);

//console.log(result);
//const container = document.querySelector('.page');
//container.innerHTML = '';
//
//badges.forEach(badge => {
//  const badgeDiv = document.createElement('div');
//  badgeDiv.classList.add('badge');
//  badgeDiv.innerHTML = `
//    <img src="${badge.img}" alt="Avatar">
//    <p>${badge.name}</p>
//  `;
//  container.appendChild(badgeDiv);
//});
