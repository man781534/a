//@version:1.0.0
//@name:全集影视
//@webSite:https://www.onibough.com/

const appConfig = {
    webSite: 'https://www.onibough.com/'
}

// 获取分类列表
async function getClassList(args) {
    return JSON.stringify({
        data: [
            { type_id: '29', type_name: '国产动漫', hasSubclass: false },
            { type_id: '6', type_name: '动作片', hasSubclass: false },
            { type_id: '7', type_name: '喜剧片', hasSubclass: false },
            { type_id: '8', type_name: '爱情片', hasSubclass: false },
            { type_id: '9', type_name: '科幻片', hasSubclass: false },
            { type_id: '10', type_name: '恐怖片', hasSubclass: false },
            { type_id: '11', type_name: '剧情片', hasSubclass: false },
            { type_id: '12', type_name: '战争片', hasSubclass: false },
            { type_id: '24', type_name: '记录片', hasSubclass: false },
            { type_id: '44', type_name: '香港电影', hasSubclass: false },
            { type_id: '45', type_name: '动漫电影', hasSubclass: false },
            { type_id: '13', type_name: '国产剧', hasSubclass: false },
            { type_id: '14', type_name: '香港剧', hasSubclass: false },
            { type_id: '15', type_name: '台剧', hasSubclass: false },
            { type_id: '16', type_name: '日剧', hasSubclass: false },
            { type_id: '20', type_name: '泰剧', hasSubclass: false },
            { type_id: '21', type_name: '韩剧', hasSubclass: false },
            { type_id: '22', type_name: '美剧', hasSubclass: false },
            { type_id: '23', type_name: '海外剧', hasSubclass: false },
            { type_id: '25', type_name: '大陆综艺', hasSubclass: false },
            { type_id: '26', type_name: '港台综艺', hasSubclass: false },
            { type_id: '27', type_name: '日韩综艺', hasSubclass: false },
            { type_id: '28', type_name: '欧美综艺', hasSubclass: false },
            { type_id: '30', type_name: '日韩动漫', hasSubclass: false },
            { type_id: '31', type_name: '港台动漫', hasSubclass: false },
            { type_id: '32', type_name: '欧美动漫', hasSubclass: false },
            { type_id: '34', type_name: '海外动漫', hasSubclass: false },
            { type_id: '36', type_name: '短剧', hasSubclass: false }
        ]
    })
}

// 获取子分类列表
async function getSubclassList(args) {
    return JSON.stringify({ data: [] })
}

// 获取视频列表
async function getVideoList(args) {
    var backData = new RepVideoList()
    try {
        let typeId = args.url || args.typeId || '13'
        let page = args.page || '1'
        let url = appConfig.webSite.replace(/\/$/, '') + `/vodshow/${typeId}--------${page}---.html`

        const pro = await req(url)
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            
            $('.ewave-vodlist.clearfix li').each((_, li) => {
                let $li = $(li)
                let video = new VideoDetail()
                
                const thumbDiv = $li.find('.ewave-vodlist__thumb.lazyload')
                if (thumbDiv.length) {
                    video.vod_pic = thumbDiv.attr('data-original') || thumbDiv.attr('data-src')
                    
                    if (!video.vod_pic) {
                        const bgImage = thumbDiv.css('background-image')
                        if (bgImage) {
                            const match = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/)
                            if (match && match[1]) {
                                video.vod_pic = match[1]
                            }
                        }
                    }
                }
                
                const titleLink = $li.find('.ewave-vodlist__detail .title a')
                if (titleLink.length) {
                    video.vod_name = titleLink.attr('title') || titleLink.text().trim()
                    video.vod_id = titleLink.attr('href')
                }
                
                const updateInfo = $li.find('.pic-text').text().trim()
                if (updateInfo) {
                    video.vod_remarks = updateInfo
                }
                
                const score = $li.find('.pic-tag-h').text().trim()
                if (score) {
                    video.vod_score = score
                }
                
                const actorInfo = $li.find('.text-actor').text().trim()
                if (actorInfo) {
                    video.vod_actor = actorInfo
                }
                
                if (video.vod_id && video.vod_name) {
                    if (!video.vod_id.startsWith('/')) {
                        video.vod_id = '/' + video.vod_id
                    }
                    
                    if (video.vod_pic && !video.vod_pic.startsWith('http')) {
                        if (video.vod_pic.startsWith('//')) {
                            video.vod_pic = 'https:' + video.vod_pic
                        } else {
                            video.vod_pic = appConfig.webSite.replace(/\/$/, '') + video.vod_pic
                        }
                    }
                    
                    backData.data.push(video)
                }
            })
        }
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}

// 获取子分类视频列表
async function getSubclassVideoList(args) {
    return getVideoList(args)
}

// 获取视频详情
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        let url = appConfig.webSite.replace(/\/$/, '') + args.url
        let pro = await req(url)
        
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            let vodDetail = new VideoDetail()
            vodDetail.vod_id = args.url
            
            vodDetail.vod_name = $('.ewave-content__detail .title span').first().text().trim()
            vodDetail.vod_pic = $('.ewave-content__thumb img.lazyload').attr('data-original') || 
                               $('.ewave-content__thumb img').attr('src')
            vodDetail.vod_content = $('.desc .left').next().text().trim()
            
            let vod_play_from = []
            let vod_play_url = []
            
            $('.nav.nav-tabs').each((navIndex, nav) => {
                let $nav = $(nav)
                let playTabs = []
                
                $nav.find('a[href^="#playlist"]').each((_, link) => {
                    let tabName = $(link).text().trim()
                    let tabId = $(link).attr('href').replace('#', '')
                    
                    if (tabName && tabId) {
                        playTabs.push({ name: tabName, id: tabId })
                    }
                })
                
                if (playTabs.length > 0) {
                    playTabs.forEach((tab, index) => {
                        let tabContent = $(`#${tab.id}`)
                        if (tabContent.length === 0) {
                            tabContent = $('.tab-pane').eq(index)
                        }
                        
                        if (tabContent.length > 0) {
                            let eps = tabContent.find('a')
                            let temp = ''
                            let hasPlayLinks = false
                            
                            eps.each((i, e) => {
                                let playUrl = $(e).attr('href')
                                if (playUrl && playUrl.includes('/vodplay/')) {
                                    hasPlayLinks = true
                                    let episodeName = $(e).text().trim() || `第${i + 1}集`
                                    temp += `${episodeName}$${playUrl}#`
                                }
                            })
                            
                            if (hasPlayLinks && temp) {
                                vod_play_from.push(tab.name)
                                vod_play_url.push(temp)
                            }
                        }
                    })
                    return false
                }
            })
            
            if (vod_play_from.length > 0 && vod_play_url.length > 0) {
                vodDetail.vod_play_from = vod_play_from.join('$$$')
                vodDetail.vod_play_url = vod_play_url.join('$$$')
            }
            
            backData.data = vodDetail
        }
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}

// 获取播放地址
async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    try {
        let playUrl = args.url.includes('$') ? args.url.split('$')[1] : args.url
        
        if (playUrl.includes('/vodplay/')) {
            let fullUrl = playUrl.startsWith('http') ? playUrl : appConfig.webSite.replace(/\/$/, '') + playUrl
            const pro = await req(fullUrl)
            
            if (pro.data) {
                const $ = cheerio.load(pro.data)
                let foundUrl = null
                
                $('script').each((_, script) => {
                    const scriptContent = $(script).html() || ''
                    if (scriptContent.includes('player_aaaa=')) {
                        const urlMatch = scriptContent.match(/"url"\s*:\s*"([^"]+)"/)
                        if (urlMatch && urlMatch[1]) {
                            foundUrl = urlMatch[1].replace(/\\\//g, '/')
                        }
                    }
                })
                
                if (!foundUrl) {
                    const htmlContent = pro.data
                    const m3u8Matches = htmlContent.match(/https?:\/\/[^\s"'<>]+\.m3u8/g)
                    if (m3u8Matches) foundUrl = m3u8Matches[0]
                }
                
                if (foundUrl) {
                    backData.data = foundUrl.startsWith('http') ? foundUrl : 'https://' + new URL(fullUrl).hostname + foundUrl
                } else {
                    backData.error = '未找到播放地址'
                }
            }
        } else if (playUrl.includes('.m3u8') || playUrl.includes('.mp4')) {
            backData.data = playUrl
        } else {
            backData.error = '无效的播放地址'
        }
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}

// 搜索视频
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        let searchWord = args.searchWord || args.wd || ''
        let page = args.page || '1'
        let url = appConfig.webSite.replace(/\/$/, '') + `/vodsearch/${encodeURIComponent(searchWord)}----------${page}---.html`
        
        const pro = await req(url)
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            
            $('.ewave-vodlist__media li, .ewave-vodlist.clearfix li').each((_, li) => {
                let $li = $(li)
                let video = new VideoDetail()
                
                const thumbDiv = $li.find('.v-thumb.ewave-vodlist__thumb.lazyload')
                if (thumbDiv.length) {
                    video.vod_pic = thumbDiv.attr('data-original') || thumbDiv.attr('data-src')
                    video.vod_name = thumbDiv.attr('title')
                    video.vod_id = thumbDiv.parent().attr('href') || thumbDiv.find('a').attr('href')
                }
                
                if (!video.vod_id || !video.vod_name) {
                    const titleLink = $li.find('.title a')
                    if (titleLink.length) {
                        video.vod_name = titleLink.text().trim()
                        video.vod_id = titleLink.attr('href')
                    }
                }
                
                const updateInfo = $li.find('.pic-text').text().trim()
                if (updateInfo) {
                    video.vod_remarks = updateInfo
                }
                
                const score = $li.find('.pic-tag-h').text().trim()
                if (score) {
                    video.vod_score = score
                }
                
                if (video.vod_id && video.vod_name) {
                    if (!video.vod_id.startsWith('/')) video.vod_id = '/' + video.vod_id
                    
                    if (video.vod_pic && !video.vod_pic.startsWith('http')) {
                        video.vod_pic = video.vod_pic.startsWith('//') ? 'https:' + video.vod_pic : appConfig.webSite.replace(/\/$/, '') + video.vod_pic
                    }
                    
                    backData.data.push(video)
                }
            })
        }
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}