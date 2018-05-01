/*
 * @Author: jaxQin
 * @Date:   2018-03-21 21:32:13
 * @Last Modified by:   jaxQin
 * @Last Modified time: 2018-04-14 13:35:21
 */

'use strict';
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];
const fs = require('fs');
(async () => {
    const getVideo = async (browser, url) => {
        let arr = url.split('/');
        let arr2 = arr.reverse();
        url = `https://m.365yg.com/i${arr2[1]}/`
        let page = await browser.newPage();
        try {
            await page.emulate(iPhone);
            await page.goto(url)
            await page.reload()
        } catch (e) {
            console.log(e)
        }
        // 判断是否是西瓜视频
        const pageTitle = await page.evaluate(() => {
            return document.title;
        });
        console.log(pageTitle)
        if (pageTitle !== '西瓜视频') {
            await page.close()
            return null
        }


        // 获取视频名称
        let title;
        try {
            await page.waitForSelector('.info-title>h1');
            title = await page.$eval('.info-title>h1', item => {
                return item.innerText
            });
            if (!title) {
                await page.waitForSelector('.info-title>h1');
                title = await page.$eval('.info-title>h1', item => {
                    return item.innerText
                });
            }
            if (!title) {
                await page.waitForSelector('.info-title>h1');
                title = await page.$eval('meta[name=description]', item => {
                    return item.content
                });
            }
            // 检查已经下载的视频中是否包含
            let files = fs.readdirSync('./video');
            files = files.join(',');
            if (files.includes(title)) return null
            // 获取视频真实地址abs-title
            await page.waitForSelector('#vjs_video_3_html5_api');
            const videoSrc = await page.$eval('#vjs_video_3_html5_api', item => {
                return item.src
            });
            console.log(`${title}--${videoSrc}`)
            await page.close();
            title = title.replace(/“/g, '')
            title = title.replace(/”/g, '')
            title = title.replace(/"/g, '')
            return {
                videoSrc,
                title,
            }
        } catch (e) {
            console.log(e)
            return null
        }

    }
    module.exports = getVideo
})()
