import Git from 'git-rev-sync';
import _ from 'lodash';
import Puppeteer from 'puppeteer';
import Epub from 'epub-gen';
import fs from 'fs';
import rimraf from 'rimraf';
import { GRAASP_HOST, TMP_PATH } from './config';
import Logger from './utils/logger';

const fetchTag = () => Git.tag();

const BASE_URL = 'https://graasp.eu';

const generateRandomString = () => Math.random().toString(36).slice(2);

const generateEpub = async ({
  title = 'Untitled',
  author = 'Anonymous', // todo: get from html
  chapters = [],
  cover,
}) => {
  Logger.debug('generating epub');
  // main options
  const main = {
    title,
    author,
    publisher: 'Graasp',
    cover,
  };

  // make sure that all content sections have data
  const content = chapters.filter(chapter => chapter.title && chapter.data);

  const output = `${TMP_PATH}/${generateRandomString()}.epub`;

  const options = {
    ...main,
    content,
    output,
  };

  // disable this lint because of our epub generation library
  // eslint-disable-next-line no-new
  return new Epub(options).promise.then(() => new Promise((resolve, reject) => {
    const stream = fs.createReadStream(output);

    const epub = [];
    stream.on('data', chunk => epub.push(chunk));
    stream.on('error', () => reject(new Error()));
    stream.on('end', () => {
      const rvalue = Buffer.concat(epub);
      rimraf(output, (error) => {
        if (error) {
          console.error(error);
        }
      });
      resolve(rvalue);
    });
  }));
};

const screenshotElements = async (elements, page) => {
  Logger.debug('capturing screenshots of elements');

  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const element of elements) {
    // get id property and resolve it as a string
    let id = await (await element.getProperty('id')).jsonValue();

    // if there is no id create a random id and set it in the dom
    if (!id || id === '') {
      id = generateRandomString();
      await page.evaluate((el, randomId) => {
        el.setAttribute('id', randomId);
      }, element, id);
    }
    // save screenshot with id as filename
    await element.screenshot({ path: `${TMP_PATH}/${id}.png` });
  }
};

const replaceElementsWithScreenshots = async (elements, page) => {
  Logger.debug('replacing elements with screenshots');

  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const element of elements) {
    await page.evaluate((el, path) => {
      const id = el.getAttribute('id');
      if (!id) {
        throw Error(`element ${el} has no id`);
      }
      const img = document.createElement('img');
      img.src = `${path}/${id}.png`;
      img.alt = el.getAttribute('title');
      el.after(img);
      el.remove();
    }, element, TMP_PATH);
  }
};

const isAbsoluteUrl = url => (url.startsWith('//') || url.startsWith('http'));

// note: cannot use async/await syntax in this
// function until the following issue is solved
// http://bit.ly/2HIyUZQ
const getBackground = (el, host) => {
  const style = el.getAttribute('style');
  const backgroundUrlArray = style.split('"');
  const backgroundUrl = backgroundUrlArray.length === 3 && backgroundUrlArray[1];
  if (backgroundUrl) {
    if (!(backgroundUrl.startsWith('//') || backgroundUrl.startsWith('http'))) {
      return host + backgroundUrl;
    }
    return backgroundUrl;
  }
  return null;
};

// todo: change to function once issue below is solved
// needs to be passed in as a string due to issue:
// http://bit.ly/2HIyUZQ
const makeImageSourcesAbsolute = `(async (imgs, host) => {
  for (const img of imgs) {
    const imgSrc = img.getAttribute('src');
    if (!await window.isAbsoluteUrl(imgSrc)) {
      img.setAttribute('src', host + imgSrc);
    }
  }
})`;

const saveEpub = async (page) => {
  Logger.debug('saving epub');

  // get title
  const titleSelector = 'div.header-content > span.ils-name-header';
  await page.waitForSelector(titleSelector);

  let title = 'Untitled';
  try {
    title = await page.$eval(titleSelector, el => el.innerHTML);
  } catch (titleErr) {
    console.error(titleErr);
  }

  // get background to use as cover
  let cover = null;
  try {
    cover = await page.$eval('div.background-holder', getBackground, BASE_URL);
    console.log(typeof cover === 'string');
    if (!(cover instanceof String) && (typeof cover !== 'string')) {
      cover = null;
    }
  } catch (err) {
    console.error(err);
  }

  // replace relative images with absolute
  await page.$$eval('img', makeImageSourcesAbsolute, BASE_URL);

  // screenshot replacements have to come after image src changes

  // replace gadgets
  const gadgets = await page.$$('div.gadget-content');
  await screenshotElements(gadgets, page);
  await replaceElementsWithScreenshots(gadgets, page);

  // remove panels accompanying gadgets
  await page.$$eval('div.panel', els => els.forEach(el => el.remove()));

  // replace embedded html divs, including youtube videos
  const embeds = await page.$$('div.embedded-html');
  await screenshotElements(embeds, page);
  await replaceElementsWithScreenshots(embeds, page);

  // get description if present and create introduction
  const introduction = {};
  try {
    // todo: parse title in appropriate language
    introduction.title = 'Introduction';
    introduction.data = await page.$eval('.ils-description', el => el.innerHTML);
  } catch (err) {
    console.error(err);
  }

  // get body for epub
  const body = await page.$$eval('div.tab-pane', phases => phases.map(phase => ({
    title: phase.getAttribute('phase-title'),
    data: phase.innerHTML,
  })));

  // concatenate introduction and body
  const chapters = [introduction, ...body];

  // prepare epub
  return generateEpub({ title, chapters, cover });
};

const formatSpace = async (page, format) => {
  Logger.debug('formatting space');
  switch (format) {
    case 'epub':
      // generate epub
      return saveEpub(page);
    case 'png':
      // print screenshot
      return page.screenshot({
        fullPage: true,
      });
    case 'pdf':
    default:
      // print pdf
      return page.pdf({
        format: 'A4',
        margin: {
          top: '1cm',
          bottom: '1cm',
        },
        printBackground: true,
      });
  }
};

const scrape = async ({ url, format }) => {
  const browser = await Puppeteer.launch({
    // headless: false,
    // slowMo: 250,
    args: ['--no-sandbox'], // todo: get to work without this flag
  });
  try {
    const page = await browser.newPage();

    // expose helper functions
    await page.exposeFunction('isAbsoluteUrl', isAbsoluteUrl);

    // todo: factor out viewport dims
    await page.setViewport({
      width: 1200,
      height: 1200,
    });

    // method will throw on error
    await page.goto(
      url,
      {
        waitUntil: 'networkidle0',
      },
    );

    // dismiss cookie banner
    const dismissCookiesMessageButton = 'a.cc-dismiss';

    // we do not want to error out just because of the cookie message
    try {
      await page.waitForSelector(dismissCookiesMessageButton, { timeout: 1000 });
      await page.click(dismissCookiesMessageButton);
    } catch (err) {
      Logger.info(`error: ${err}`);
    }

    // wait three more seconds just in case
    await page.waitFor(3000);
    const formattedPage = await formatSpace(page, format);
    await browser.close();

    return formattedPage;
  } catch (err) {
    Logger.error(err);
    browser.close();
    return false;
  }
};

const convertSpaceToFile = async (id, query, headers) => {
  Logger.debug('converting space to file');

  // sign in automatically if needed
  let token = headers.authorization;
  if (token && token.indexOf('Bearer ') === 0) {
    // just include the token string and not the bearer prefix
    token = token.substring(7);
  }
  const params = query;
  if (token) {
    params.authorization = token;
  }

  // build url from query parameters
  let url = `${GRAASP_HOST}/ils/${id}/?printPreview`;
  const validParams = [
    'lang',
    'userId',
    'reviewerId',
    'reviewerName',
    'appsOnly',
    'authorization',
  ];

  // build url from query parameters
  _.each(params, (value, key) => {
    if (_.includes(validParams, key)) {
      url += `&${key}`;
      if (value) {
        url += `=${encodeURIComponent(value)}`;
      }
    }
  });

  // return in pdf format by default
  const { format = 'pdf' } = query;

  const page = await scrape({ url, format });

  if (!page) {
    const prettyUrl = url.split('?')[0];
    throw Error(`space ${prettyUrl} could not be printed`);
  }

  return page;
};

export {
  convertSpaceToFile,
  fetchTag,
};
