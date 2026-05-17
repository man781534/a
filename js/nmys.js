//@version:1.0.0
//@name:柠檬影视
//@webSite:https://m.ydfdj.com/

const appConfig = {
    webSite: 'https://m.ydfdj.com/'
}

// 获取分类列表
async function getClassList(args) {
    return JSON.stringify({
        data: [
            // 电影分类
            { type_id: '6', type_name: '动作片', hasSubclass: false },
            { type_id: '7', type_name: '喜剧片', hasSubclass: false },
            { type_id: '8', type_name: '爱情片', hasSubclass: false },
            { type_id: '9', type_name: '科幻片', hasSubclass: false },
            { type_id: '10', type_name: '恐怖片', hasSubclass: false },
            { type_id: '11', type_name: '剧情片', hasSubclass: false },
            { type_id: '12', type_name: '战争片', hasSubclass: false },
            { type_id: '24', type_name: '动画片', hasSubclass: false },
            
            // 电视剧分类
            { type_id: '13', type_name: '国产剧', hasSubclass: false },
            { type_id: '14', type_name: '香港剧', hasSubclass: false },
            { type_id: '15', type_name: '韩国剧', hasSubclass: false },
            { type_id: '16', type_name: '欧美剧', hasSubclass: false },
            { type_id: '20', type_name: '台湾剧', hasSubclass: false },
            { type_id: '21', type_name: '日本剧', hasSubclass: false },
            { type_id: '34', type_name: '泰剧', hasSubclass: false },
            { type_id: '22', type_name: '其它剧', hasSubclass: false },
            
            // 综艺分类
            { type_id: '25', type_name: '大陆综艺', hasSubclass: false },
            { type_id: '26', type_name: '日韩综艺', hasSubclass: false },
            { type_id: '27', type_name: '港台综艺', hasSubclass: false },
            { type_id: '28', type_name: '欧美综艺', hasSubclass: false },
            
            // 动漫分类
            { type_id: '29', type_name: '国产动漫', hasSubclass: false },
            { type_id: '30', type_name: '日韩动漫', hasSubclass: false },
            { type_id: '31', type_name: '欧美动漫', hasSubclass: false },
            { type_id: '32', type_name: '其它动漫', hasSubclass: false },
            
            // 短剧分类
            { type_id: '37', type_name: '爽文短剧', hasSubclass: false },
            { type_id: '38', type_name: '女频恋爱', hasSubclass: false },
            { type_id: '39', type_name: '反转爽剧', hasSubclass: false },
            { type_id: '40', type_name: '古装仙侠', hasSubclass: false },
            { type_id: '41', type_name: '年代穿越', hasSubclass: false },
            { type_id: '42', type_name: '闹洞悬疑', hasSubclass: false },
            { type_id: '43', type_name: '现代都市', hasSubclass: false }
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
        let url = appConfig.webSite.replace(/\/$/, '') + `/show/${typeId}--------${page}---.html`

        const pro = await req(url)
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            $('.stui-vodlist.clearfix li').each((_, li) => {
                let $li = $(li)
                let video = new VideoDetail()
                
                let link = $li.find('.stui-vodlist__box a')
                if (link.length > 0) {
                    video.vod_pic = link.attr('data-original') || link.attr('data-src')
                    video.vod_name = link.attr('title')
                    video.vod_id = link.attr('href')
                    
                    if (video.vod_id && video.vod_name) {
                        if (!video.vod_id.startsWith('/')) video.vod_id = '/' + video.vod_id
                        if (video.vod_pic && !video.vod_pic.startsWith('http')) {
                            video.vod_pic = video.vod_pic.startsWith('//') ? 'https:' + video.vod_pic : appConfig.webSite.replace(/\/$/, '') + video.vod_pic
                        }
                        
                        // 添加备注信息
                        let type = $li.find('.pic-text.text-right').eq(0).text().trim()
                        let area = $li.find('.pic-text1.text-right').eq(1).text().trim()
                        let update = $li.find('.xing_vb6').text().trim()
                        
                        if (type && area) video.vod_remarks = `${type} / ${area}`
                        else if (type) video.vod_remarks = type
                        if (update) video.vod_remarks += (video.vod_remarks ? ' | ' : '') + update
                        
                        backData.data.push(video)
                    }
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
            
            // 基本信息
            vodDetail.vod_name = $('h1.title').text().trim()
            vodDetail.vod_pic = $('.pic img.lazyload').attr('data-original') || 
                               $('.pic img').attr('src')
            vodDetail.vod_content = $('.vodplayinfo').prev().text().trim() || 
                                   $('.content_desc').text().trim()
            
            // 详细信息提取
            const infoElements = $('.stui-content__detail p.data')
            infoElements.each((_, el) => {
                const text = $(el).text().trim()
                if (text.includes('类型：')) vodDetail.vod_type = text.replace('类型：', '').trim()
                else if (text.includes('地区：')) vodDetail.vod_area = text.replace('地区：', '').trim()
                else if (text.includes('语言：')) vodDetail.vod_lang = text.replace('语言：', '').trim()
                else if (text.includes('年份：')) vodDetail.vod_year = text.replace('年份：', '').trim()
                else if (text.includes('导演：')) vodDetail.vod_director = text.replace('导演：', '').trim()
                else if (text.includes('主演：')) vodDetail.vod_actor = text.replace('主演：', '').trim()
            })
            
            vodDetail.vod_remarks = $('.xing_vb6').text().trim() || $('.data').last().text().trim()
            
            // 播放地址 - 按照奇优影视的分组方式
            let vod_play_url = []
            
            // 获取所有播放线路的Tab
            let playlistTabs = []
            $('.stui-pannel__head .nav-tabs li a').each((index, tabLink) => {
                let tabName = $(tabLink).text().trim()
                let tabId = $(tabLink).attr('href')
                if (tabName && tabId) {
                    playlistTabs.push({
                        id: tabId.replace('#', ''),
                        name: tabName
                    })
                }
            })
            
            // 如果没有找到Tab，则添加一个默认
            if (playlistTabs.length === 0) {
                let defaultTabName = $('.stui-pannel__head h3.title').text().trim() || '播放线路'
                playlistTabs.push({
                    id: 'playlist1',
                    name: defaultTabName
                })
            }
            
            // 遍历每个Tab（播放线路）
            playlistTabs.forEach((tab, tabIndex) => {
                let tabContent = $(`#${tab.id}`)
                // 如果没有找到对应的内容区域，尝试其他选择器
                if (tabContent.length === 0) {
                    tabContent = $('.tab-content .tab-pane').eq(tabIndex)
                }
                
                if (tabContent.length > 0) {
                    let eps = tabContent.find('.stui-content__playlist a, a')
                    let temp = ''
                    
                    eps.each((index, e) => {
                        let playUrl = $(e).attr('href')
                        if (playUrl && playUrl.includes('/play/')) {
                            let episodeName = $(e).text().trim() || `第${index + 1}集`
                            temp += `${episodeName}$${playUrl}#`
                        }
                    })
                    
                    // 如果有剧集，添加到播放地址列表
                    if (temp) {
                        vod_play_url.push(temp)
                    }
                }
            })
            
            // 如果没有找到播放地址，尝试其他选择器
            if (vod_play_url.length === 0) {
                $('.stui-content__playlist').each((index, element) => {
                    let eps = $(element).find('a')
                    let temp = ''
                    
                    eps.each((index, e) => {
                        let playUrl = $(e).attr('href')
                        if (playUrl && playUrl.includes('/play/')) {
                            let episodeName = $(e).text().trim() || `第${index + 1}集`
                            temp += `${episodeName}$${playUrl}#`
                        }
                    })
                    
                    if (temp) {
                        vod_play_url.push(temp)
                    }
                })
            }
            
            // 设置播放地址
            if (vod_play_url.length > 0) {
                vodDetail.vod_play_url = vod_play_url.join('$$$')
            } else {
                vodDetail.vod_remarks = (vodDetail.vod_remarks || '') + ' | 未找到播放地址'
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
        
        if (playUrl.includes('/play/')) {
            let fullUrl = playUrl.startsWith('http') ? playUrl : appConfig.webSite.replace(/\/$/, '') + playUrl
            const pro = await req(fullUrl)
            
            if (pro.data) {
                const $ = cheerio.load(pro.data)
                let foundUrl = null
                
                // 方法1：从script标签中提取player_aaaa对象
                $('script').each((_, script) => {
                    const scriptContent = $(script).html() || ''
                    
                    // 查找包含player_aaaa的script标签
                    if (scriptContent.includes('player_aaaa=')) {
                        try {
                            // 提取JSON部分 - 处理带引号和不带引号的情况
                            let jsonStr = ''
                            
                            // 匹配格式: player_aaaa={...}
                            const match = scriptContent.match(/player_aaaa\s*=\s*(\{[\s\S]*?\})(?:\s*;|\s*$)/)
                            if (match && match[1]) {
                                jsonStr = match[1]
                            }
                            
                            // 如果没匹配到，尝试匹配: "player_aaaa":{...}
                            if (!jsonStr) {
                                const match2 = scriptContent.match(/"player_aaaa"\s*:\s*(\{[\s\S]*?\})(?:\s*,|\s*$)/)
                                if (match2 && match2[1]) {
                                    jsonStr = match2[1]
                                }
                            }
                            
                            // 如果还没匹配到，尝试匹配: var player_aaaa={...}
                            if (!jsonStr) {
                                const match3 = scriptContent.match(/var\s+player_aaaa\s*=\s*(\{[\s\S]*?\})(?:\s*;|\s*$)/)
                                if (match3 && match3[1]) {
                                    jsonStr = match3[1]
                                }
                            }
                            
                            if (jsonStr) {
                                // 修复可能的JSON格式问题
                                jsonStr = jsonStr.replace(/\\\//g, '/')
                                
                                // 解析JSON
                                const playerData = JSON.parse(jsonStr)
                                
                                // 提取播放地址
                                if (playerData.url) {
                                    foundUrl = playerData.url
                                } else if (playerData.link) {
                                    // 如果有link但没有url，可能需要进一步处理
                                    foundUrl = playerData.link
                                }
                            }
                        } catch (e) {
                            console.log('JSON解析失败:', e.message)
                        }
                    }
                })
                
                // 方法2：如果JSON解析失败，使用正则直接提取
                if (!foundUrl) {
                    const htmlContent = pro.data
                    
                    // 直接搜索m3u8链接
                    const m3u8Regex = /https?:\/\/[^\s"'<>]+\.m3u8/g
                    const matches = htmlContent.match(m3u8Regex)
                    if (matches && matches.length > 0) {
                        foundUrl = matches[0]
                    }
                    
                    // 如果没找到m3u8，尝试找mp4
                    if (!foundUrl) {
                        const mp4Regex = /https?:\/\/[^\s"'<>]+\.mp4/g
                        const mp4Matches = htmlContent.match(mp4Regex)
                        if (mp4Matches && mp4Matches.length > 0) {
                            foundUrl = mp4Matches[0]
                        }
                    }
                }
                
                if (foundUrl) {
                    // 清理URL
                    foundUrl = foundUrl.replace(/\\\//g, '/').replace(/\\\//g, '/')
                    
                    // 确保URL是完整的
                    if (!foundUrl.startsWith('http')) {
                        if (foundUrl.startsWith('//')) {
                            foundUrl = 'https:' + foundUrl
                        } else if (foundUrl.startsWith('/')) {
                            foundUrl = appConfig.webSite.replace(/\/$/, '') + foundUrl
                        } else {
                            foundUrl = 'https://' + foundUrl
                        }
                    }
                    
                    backData.data = foundUrl
                } else {
                    backData.error = '未找到播放地址'
                }
            } else {
                backData.error = '播放页面请求失败'
            }
        } else if (playUrl.includes('.m3u8') || playUrl.includes('.mp4')) {
            // 如果已经是直接的m3u8或mp4链接
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
        let url = appConfig.webSite.replace(/\/$/, '') + `/search/${encodeURIComponent(searchWord)}----------${page}---.html`
        
        const pro = await req(url)
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            
            // 尝试不同的选择器
            $('ul.stui-vodlist__media li, .stui-vodlist__media li, li').each((_, li) => {
                let $li = $(li)
                let video = new VideoDetail()
                
                // 查找缩略图链接
                let thumbLink = $li.find('a.v-thumb.stui-vodlist__thumb.lazyload, .v-thumb.lazyload, a.lazyload')
                if (thumbLink.length > 0) {
                    video.vod_id = thumbLink.attr('href')
                    video.vod_name = thumbLink.attr('title')
                    video.vod_pic = thumbLink.attr('data-original') || thumbLink.attr('data-src')
                }
                
                // 如果通过缩略图没找到，尝试标题链接
                if (!video.vod_id) {
                    let titleLink = $li.find('h3.title a, .title a, a[title]')
                    if (titleLink.length > 0) {
                        video.vod_id = video.vod_id || titleLink.attr('href')
                        video.vod_name = video.vod_name || titleLink.attr('title') || titleLink.text().trim()
                    }
                }
                
                // 如果还没有图片，尝试从背景图片中提取
                if (!video.vod_pic) {
                    let thumbDiv = $li.find('.v-thumb, .thumb')
                    if (thumbDiv.length > 0) {
                        let style = thumbDiv.attr('style') || ''
                        let bgMatch = style.match(/background-image:\s*url\(['"]?([^'"\)]+)['"]?\)/)
                        if (bgMatch && bgMatch[1]) {
                            video.vod_pic = bgMatch[1]
                        }
                    }
                }
                
                if (video.vod_id && video.vod_name) {
                    if (!video.vod_id.startsWith('/')) video.vod_id = '/' + video.vod_id
                    
                    // 处理图片URL
                    if (video.vod_pic && !video.vod_pic.startsWith('http')) {
                        video.vod_pic = video.vod_pic.startsWith('//') ? 'https:' + video.vod_pic : appConfig.webSite.replace(/\/$/, '') + video.vod_pic
                    }
                    
                    // 添加备注信息
                    let updateInfo = $li.find('.pic-text.text-right, .text-muted, .update').text().trim()
                    if (updateInfo) {
                        video.vod_remarks = updateInfo
                    }
                    
                    backData.data.push(video)
                }
            })
            
            // 如果没找到，尝试其他选择器
            if (backData.data.length === 0) {
                $('.stui-vodlist.clearfix li, .vodlist li').each((_, li) => {
                    let $li = $(li)
                    let video = new VideoDetail()
                    
                    let link = $li.find('a')
                    if (link.length > 0) {
                        video.vod_id = link.attr('href')
                        video.vod_name = link.attr('title') || link.text().trim()
                        
                        // 查找图片
                        let img = $li.find('img.lazyload, img')
                        if (img.length > 0) {
                            video.vod_pic = img.attr('data-original') || img.attr('src') || img.attr('data-src')
                        }
                        
                        if (video.vod_id && video.vod_name) {
                            if (!video.vod_id.startsWith('/')) video.vod_id = '/' + video.vod_id
                            video.vod_remarks = '搜索结果'
                            backData.data.push(video)
                        }
                    }
                })
            }
        }
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}