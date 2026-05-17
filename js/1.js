//@version:1.0.0
//@name:七色影视
//@webSite: https://www.qisdy.com/

const appConfig = {
    webSite: 'https://www.qisdy.com/'
}

// 获取分类列表
async function getClassList(args) {
    return JSON.stringify({
        data: [
            { type_id: '1', type_name: '电影', hasSubclass: false },
            { type_id: '2', type_name: '电视剧', hasSubclass: false },
            { type_id: '3', type_name: '综艺', hasSubclass: false },
            { type_id: '4', type_name: '动漫', hasSubclass: false },
            { type_id: '5', type_name: '纪录', hasSubclass: false }
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
        let typeId = args.url || args.typeId || '1'
        let page = args.page || '1'
        let url = appConfig.webSite.replace(/\/$/, '') + `/vodshow/${typeId}--------${page}---.html`

        const pro = await req(url)
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            
            $('.myui-vodlist__box').each((_, box) => {
                let $box = $(box)
                let video = new VideoDetail()
                
                // 获取缩略图链接
                const thumbLink = $box.find('.myui-vodlist__thumb.lazyload')
                if (thumbLink.length) {
                    video.vod_pic = thumbLink.attr('data-original')
                    video.vod_id = thumbLink.attr('href')
                    video.vod_name = thumbLink.attr('title')
                }
                
                // 获取更新信息
                const updateSpan = $box.find('.pic-text.text-right')
                if (updateSpan.length) {
                    video.vod_remarks = updateSpan.text().trim()
                }
                
                // 数据验证和处理
                if (video.vod_id && video.vod_name) {
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
            
            // 获取标题
            vodDetail.vod_name = $('.myui-content__detail .title').first().text().trim()
            
            // 获取封面图
            vodDetail.vod_pic = $('.myui-content__thumb img.lazyload').attr('data-original') || 
                               $('.myui-content__thumb img').attr('src')
            
            // 获取播放源和剧集列表
            let vod_play_from = []
            let vod_play_url = []
            
            // 查找播放源标签
            $('.nav.nav-tabs li a').each((_, link) => {
                let tabName = $(link).text().trim()
                if (tabName) {
                    vod_play_from.push(tabName)
                }
            })
            
            // 解析剧集
            $('.tab-pane').each((index, pane) => {
                let episodes = []
                $(pane).find('.myui-content__list.sort-list a').each((_, episode) => {
                    let epName = $(episode).text().trim()
                    let epUrl = $(episode).attr('href')
                    
                    if (epName && epUrl) {
                        episodes.push(`${epName}$${epUrl}`)
                    }
                })
                
                if (episodes.length > 0) {
                    vod_play_url.push(episodes.join('#'))
                }
            })
            
            // 确保播放源数量与剧集列表匹配
            if (vod_play_from.length === 0 && vod_play_url.length > 0) {
                vod_play_from = ['播放源']
            }
            
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
                
                // 查找script中的播放地址
                $('script').each((_, script) => {
                    const scriptContent = $(script).html() || ''
                    if (scriptContent.includes('player_aaaa=') || scriptContent.includes('url')) {
                        const urlMatch = scriptContent.match(/"url"\s*:\s*"([^"]+)"/)
                        if (urlMatch && urlMatch[1]) {
                            foundUrl = urlMatch[1].replace(/\\\//g, '/')
                        }
                    }
                })
                
                if (foundUrl) {
                    backData.data = foundUrl
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
            
            $('#searchList li.clearfix').each((_, li) => {
                let $li = $(li)
                let video = new VideoDetail()
                
                // 获取缩略图
                const thumbLink = $li.find('.myui-vodlist__thumb.lazyload')
                if (thumbLink.length) {
                    video.vod_pic = thumbLink.attr('data-original')
                    video.vod_id = thumbLink.attr('href')
                    video.vod_name = thumbLink.attr('title')
                }
                
                // 获取更新信息
                const updateInfo = $li.find('.pic-text.text-right').text().trim()
                if (updateInfo) {
                    video.vod_remarks = updateInfo
                }
                
                // 数据验证和处理
                if (video.vod_id && video.vod_name) {
                    backData.data.push(video)
                }
            })
        }
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}