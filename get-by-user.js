const cheerio = require('cheerio'); //可以像jquer一样操作界面
const charset = require('superagent-charset'); //解决乱码问题:
const async = require('async'); //异步抓取
const express = require('express');
const eventproxy = require('eventproxy'); //流程控制
const ep = eventproxy();
const app = express();
const path = require('path')
const fs = require('fs')
const util = require('util');
const puppeteer = require('puppeteer');
const request = require('superagent');

const getVideo = require('./downVideo') //引入下载视频方法
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

charset(request);

let superagentPromisePlugin = require('superagent-promise-plugin');
superagentPromisePlugin.Promise = require('es6-promise');

let url = 'https://www.toutiao.com/search_content/?offset=0&format=json&autoload=true&count=20&cur_tab=4&from=media';
let name = null;

(async () => {
    let browser;
    const searchUser = async keyword => {
        let arr = await request.get(url).query({ keyword, }).use(superagentPromisePlugin);
        arr = arr.text;
        let data = JSON.parse(arr);
        arr = data.data;
        for (item of arr) {
            if (item.media_id && item.name === keyword) return item;
        }
    };
    const getSearchUrl = async url => {
        let page;
        try {
            page = await browser.newPage();
        } catch (e) {
            console.log(`${item.title}浏览器创建失败`);
            // page = await browser.newPage();
        }
        if (!page) {
            return null
        }
        await page.goto(url);
        await page.reload();
        await (500)
        await page.reload();
        await (500)
        const getUrl = async () => {
            return new Promise((resolve, reject) => {
                page.on('response', res => {
                    // console.log(res.url)
                    if (res.url.indexOf('user/article/') > -1) {
                        page.close()
                        resolve(res.url)
                    }
                })
            })
        }
        let a = await getUrl();
        page.close()
        return a
    }
    const getSearchArr = async url => {
        console.log('搜索用户的视频')
        url = url.replace('count=20', 'count=200')
        let page = await browser.newPage();
        await page.goto(url)
        // 获取视频名称
        let data;
        await page.waitForSelector('pre');
        data = await page.$eval('pre', item => {
            return item.innerText
        });
        data = JSON.parse(data)

        arr = data.data;
        let newArr = []
        // console.log(arr[0])
        for (let video of arr) {
            let playNum = video.detail_play_effective_count
            if (playNum > 20000) {
                newArr.push(video)
            }
        }
        console.log(`可以进行爬取的视频有${newArr.length}条`)
        return newArr;
    }

    app.get('/', async (req, res, next) => {
        browser = await puppeteer.launch({
            headless: false,
            executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',

        });
        const userName = req.query.keyword;
        name = userName
        console.log(`name--${name}`)
        let user = await searchUser(userName);
        let url = user.source_url;
        console.log(url)
        // 获取到可以进行搜索的url
        let surl = await getSearchUrl(url);
        surl = surl.replace('page_type=1', 'page_type=0')
        let arr = await getSearchArr(surl);
        res.send({ url: arr })

        let myArr = []
        for (let item of arr) {
            let video = await getVideo(browser, item.display_url);
            if (!video) continue
            video = Object.assign(item, video)
            myArr.push(video)
            let filePath
            try {
                filePath = fs.createWriteStream(`./video/${video.title}.mp4`)
            } catch (e) {
                console.log('创建目录出错！！！！');
                continue
            }
            request.get(video.videoSrc).pipe(filePath)
        }
        await sleep(10000)
        console.log('----下载完成------')
        browser.close()
    });



    app.listen(3003, function (req, res) {
        console.log('app is running at port 3003');
    });

})()
