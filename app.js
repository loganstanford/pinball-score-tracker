const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const app = express();
const BASE_URL = 'https://insider.sternpinball.com/kiosk/';

const fetchRenderedHTML = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  const html = await page.content();
  await browser.close();
  return html;
};

const parseHtmlContent = (html) => {
  const $ = cheerio.load(html);
  const games = {};

  $('.list-item.card.list').each((i, elem) => {
    const gameName = $(elem).find('.leaderboard-header p.hd-xs').text().replace('High Scores', '').trim();
    const game = gameName || 'Unknown';
    games[game] = games[game] || [];

    $(elem).find('li').each((j, scoreElem) => {
      const username = $(scoreElem).find('p.font-semibold').text().trim();
      const score = $(scoreElem).find('div.text-vintage').text().trim();
      
      if (username && score) {
        games[game].push({ username, score });
      }
    });
  });

  return games;
};

app.get('/api/scores/:path', async (req, res) => {
  try {
    const pathParam = req.params.path;
    const fullUrl = BASE_URL + pathParam;
    const html = await fetchRenderedHTML(fullUrl);
    const data = parseHtmlContent(html);
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Failed to fetch and parse scores');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
