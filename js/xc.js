//@version:1.0.0
//@name:星辰影视
//@webSite: https://www.shandongbaogai.com/

const appConfig = {
    webSite: 'https://www.shandongbaogai.com/'
}

// 获取分类列表
async function getClassList(args) {
    return JSON.stringify({
        data: [
            { type_id: '1', type_name: '电影', hasSubclass: false },
            { type_id: '2', type_name: '电视剧', hasSubclass: false },
            { type_id: '3', type_name: '综艺', hasSubclass: false },
            { type_id: '4', type_name: '动漫', hasSubclass: false },
            { type_id: '5', type_name: '短剧', hasSubclass: false }
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
        let url = appConfig.webSite.replace(/\/$/, '') + `/xcssshow/${typeId}--------${page}---.html`
        
        const pro = await req(url)
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            
            const selectors = [
                '.stui-vodlist.clearfix li',
                '.stui-vodlist__bd.clearfix li',
                '.stui-vodlist__box',
                '.col-md-6.col-sm-4.col-xs-3',
                '.stui-vodlist__media li'
            ]
            
            for (const selector of selectors) {
                const items = $(selector)
                if (items.length > 0) {
                    items.each((_, element) => {
                        try {
                            let $elem = $(element)
                            let video = new VideoDetail()
                            
                            let thumbLink = $elem.find('.stui-vodlist__thumb.lazyload')
                            if (thumbLink.length === 0) {
                                thumbLink = $elem.find('a.lazyload')
                            }
                            if (thumbLink.length === 0) {
                                thumbLink = $elem.find('a')
                            }
                            
                            if (thumbLink.length) {
                                video.vod_pic = thumbLink.attr('data-original') || 
                                              thumbLink.attr('data-src') || 
                                              thumbLink.find('img').attr('data-original') ||
                                              thumbLink.find('img').attr('src')
                                
                                if (!video.vod_pic) {
                                    const style = thumbLink.attr('style')
                                    if (style) {
                                        const match = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/)
                                        if (match && match[1]) {
                                            video.vod_pic = match[1]
                                        }
                                    }
                                }
                                
                                video.vod_id = thumbLink.attr('href')
                                video.vod_name = thumbLink.attr('title') || 
                                               thumbLink.find('.pic-text').text().trim() ||
                                               thumbLink.text().trim()
                            }
                            
                            const detailDiv = $elem.find('.stui-vodlist__detail')
                            if (detailDiv.length) {
                                const titleLink = detailDiv.find('.title a')
                                if (titleLink.length) {
                                    video.vod_name = video.vod_name || titleLink.text().trim()
                                    video.vod_id = video.vod_id || titleLink.attr('href')
                                }
                                
                                const actorText = detailDiv.find('.text.text-overflow.text-muted.hidden-xs').text().trim()
                                if (actorText) {
                                    video.vod_actor = actorText
                                }
                            }
                            
                            const updateInfo = $elem.find('.pic-text.text-right').text().trim()
                            if (updateInfo) {
                                video.vod_remarks = updateInfo
                            }
                            
                            if (video.vod_id && video.vod_name) {
                                if (!video.vod_id.startsWith('/')) {
                                    video.vod_id = '/' + video.vod_id
                                }
                                
                                if (video.vod_pic) {
                                    if (video.vod_pic.startsWith('//')) {
                                        video.vod_pic = 'https:' + video.vod_pic
                                    } else if (!video.vod_pic.startsWith('http')) {
                                        video.vod_pic = appConfig.webSite.replace(/\/$/, '') + video.vod_pic
                                    }
                                }
                                
                                backData.data.push(video)
                            }
                        } catch (itemError) {
                            // 静默处理解析错误
                        }
                    })
                    break
                }
            }
            
        } else {
            backData.error = '获取列表页失败'
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

// 获取视频详情 - 已修复：完整提取类型、地区、年份和剧情简介
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        let url = appConfig.webSite.replace(/\/$/, '') + args.url
        
        let pro = await req(url)
        
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            let vodDetail = new VideoDetail()
            vodDetail.vod_id = args.url
            
            // 获取视频名称
            vodDetail.vod_name = $('.stui-content__detail h1.title').first().text().replace(/\s*[\d\.]+\s*$/, '').trim()
            
            // 获取评分
            const score = $('.stui-content__detail .score.text-red').text().trim()
            if (score) vodDetail.vod_score = score
            
            // 获取封面图片
            vodDetail.vod_pic = $('.stui-content__thumb img.lazyload').attr('data-original') || 
                               $('.stui-content__thumb img').attr('src')
            if (vodDetail.vod_pic && !vodDetail.vod_pic.startsWith('http')) {
                vodDetail.vod_pic = appConfig.webSite.replace(/\/$/, '') + vodDetail.vod_pic
            }
            
            // 修复：提取类型、地区、年份等元数据
            const detailItems = $('.stui-content__detail p.data')
            detailItems.each((_, element) => {
                const text = $(element).text().trim()
                if (text.includes('类型：')) {
                    vodDetail.type_name = text.replace('类型：', '').trim()
                } else if (text.includes('地区：')) {
                    vodDetail.vod_area = text.replace('地区：', '').trim()
                } else if (text.includes('年份：') || text.includes('上映：')) {
                    vodDetail.vod_year = text.replace('年份：', '').replace('上映：', '').trim()
                } else if (text.includes('主演：')) {
                    vodDetail.vod_actor = text.replace('主演：', '').trim()
                } else if (text.includes('导演：')) {
                    vodDetail.vod_director = text.replace('导演：', '').trim()
                }
            })
            
            // 修复：获取剧情简介 - 根据提供的HTML结构
            vodDetail.vod_content = $('.stui-pannel_bd .col-pd').first().text().trim()
            // 如果上述选择器没找到，尝试其他选择器
            if (!vodDetail.vod_content) {
                vodDetail.vod_content = $('.stui-pannel-box .stui-pannel_bd .col-pd').first().text().trim()
            }
            if (!vodDetail.vod_content) {
                vodDetail.vod_content = $('.stui-pannel__bd .col-pd').first().text().trim()
            }
            
            let vod_play_from = []
            let vod_play_url = []
            
            $('.stui-pannel.stui-pannel-bg.clearfix').each((index, element) => {
                const $elem = $(element)
                
                const title = $elem.find('.stui-pannel__head h3.title').text().trim()
                if (title && (title.includes('SVIP') || title.includes('播放') || title.includes('线路'))) {
                    
                    let sourceName = title
                    vod_play_from.push(sourceName)
                    
                    let episodes = ''
                    $elem.find('.stui-content__playlist.clearfix li a').each((epIndex, link) => {
                        const $link = $(link)
                        const epName = $link.text().trim() || `第${epIndex + 1}集`
                        const epUrl = $link.attr('href')
                        
                        if (epUrl) {
                            episodes += `${epName}$${epUrl}#`
                        }
                    })
                    
                    if (episodes) {
                        vod_play_url.push(episodes)
                    } else {
                        const playBtn = $elem.find('.btn.btn-primary').attr('href')
                        if (playBtn) {
                            vod_play_url.push(`正片$${playBtn}#`)
                        }
                    }
                }
            })
            
            if (vod_play_from.length === 0) {
                const playBtn = $('.play-btn a.btn.btn-primary').attr('href')
                if (playBtn) {
                    vod_play_from.push('默认线路')
                    vod_play_url.push(`正片$${playBtn}#`)
                }
            }
            
            if (vod_play_from.length > 0 && vod_play_url.length > 0) {
                vodDetail.vod_play_from = vod_play_from.join('$$$')
                vodDetail.vod_play_url = vod_play_url.join('$$$')
            }
            
            backData.data = vodDetail
        } else {
            backData.error = '获取详情页失败'
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
        
        // 检查是否是播放页链接
        if (playUrl.includes('/xcssplay/')) {
            let fullUrl = playUrl.startsWith('http') ? playUrl : appConfig.webSite.replace(/\/$/, '') + playUrl
            
            const pro = await req(fullUrl)
            
            if (pro.data) {
                const $ = cheerio.load(pro.data)
                let foundUrl = null
                
                // 方法1: 查找包含 player_aaaa 的脚本
                $('script').each((_, script) => {
                    const scriptContent = $(script).html() || ''
                    if (scriptContent.includes('player_aaaa=')) {
                        const urlMatch = scriptContent.match(/"url"\s*:\s*"([^"]+)"/)
                        if (urlMatch && urlMatch[1]) {
                            foundUrl = urlMatch[1].replace(/\\\//g, '/')
                        }
                    }
                })
                
                // 方法2: 如果没找到，从HTML中搜索m3u8链接
                if (!foundUrl) {
                    const htmlContent = pro.data
                    const m3u8Matches = htmlContent.match(/https?:\/\/[^\s"'<>]+\.m3u8/g)
                    if (m3u8Matches) {
                        foundUrl = m3u8Matches[0]
                    }
                }
                
                if (foundUrl) {
                    // 确保URL格式正确
                    if (foundUrl.startsWith('//')) {
                        foundUrl = 'https:' + foundUrl
                    } else if (!foundUrl.startsWith('http')) {
                        // 如果URL不是以http开头，可能是相对路径
                        const urlObj = new URL(fullUrl)
                        foundUrl = 'https://' + urlObj.hostname + foundUrl
                    }
                    backData.data = foundUrl
                } else {
                    backData.error = '未找到播放地址'
                }
            } else {
                backData.error = '获取播放页失败'
            }
        } else if (playUrl.includes('.m3u8') || playUrl.includes('.mp4')) {
            // 直接返回m3u8或mp4链接
            backData.data = playUrl
        } else {
            backData.error = '无效的播放地址'
        }
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}

// 搜索视频 - 已修复：根据提供的HTML结构
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        let searchWord = args.searchWord || args.wd || ''
        let page = args.page || '1'
        
        // 修复：使用正确的搜索URL格式
        let url = appConfig.webSite.replace(/\/$/, '') + `/xcsssearch/-------------.html?wd=${encodeURIComponent(searchWord)}&page=${page}`
        
        const pro = await req(url)
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            
            // 修复：根据提供的HTML结构选择正确的选择器
            $('ul.stui-vodlist__media li.active').each((_, element) => {
                try {
                    let $elem = $(element)
                    let video = new VideoDetail()
                    
                    // 1. 查找缩略图和链接
                    let thumbLink = $elem.find('.stui-vodlist__thumb.lazyload')
                    
                    if (thumbLink.length) {
                        // 从data-original属性获取图片URL
                        video.vod_pic = thumbLink.attr('data-original')
                        
                        // 如果data-original没有，从style属性提取背景图片
                        if (!video.vod_pic) {
                            const style = thumbLink.attr('style')
                            if (style) {
                                // 修复：匹配引号内的URL
                                const match = style.match(/background-image:\s*url\(["']([^"']+)["']\)/)
                                if (match && match[1]) {
                                    video.vod_pic = match[1]
                                }
                            }
                        }
                        
                        // 获取视频ID和名称
                        video.vod_id = thumbLink.attr('href')
                        video.vod_name = thumbLink.attr('title') || $elem.find('h3.title a').text().trim()
                    }
                    
                    // 2. 从详情div获取信息
                    const detailDiv = $elem.find('.detail')
                    if (detailDiv.length) {
                        // 获取标题
                        const titleLink = detailDiv.find('h3.title a')
                        if (titleLink.length) {
                            video.vod_name = video.vod_name || titleLink.text().trim()
                            video.vod_id = video.vod_id || titleLink.attr('href')
                        }
                        
                        // 获取其他信息
                        detailDiv.find('p').each((_, pElem) => {
                            const text = $(pElem).text().trim()
                            if (text.includes('主演：')) {
                                video.vod_actor = text.replace('主演：', '').trim()
                            } else if (text.includes('导演：')) {
                                video.vod_director = text.replace('导演：', '').trim()
                            } else if (text.includes('年份：')) {
                                video.vod_year = text.replace('年份：', '').trim()
                            } else if (text.includes('地区：')) {
                                video.vod_area = text.replace('地区：', '').trim()
                            } else if (text.includes('类型：')) {
                                video.type_name = text.replace('类型：', '').trim()
                            }
                        })
                    }
                    
                    // 3. 获取更新状态
                    const updateInfo = $elem.find('.pic-text.text-right').text().trim()
                    if (updateInfo) {
                        video.vod_remarks = updateInfo
                    }
                    
                    // 4. 验证并添加视频信息
                    if (video.vod_id && video.vod_name) {
                        // 确保ID以斜杠开头
                        if (!video.vod_id.startsWith('/')) {
                            video.vod_id = '/' + video.vod_id
                        }
                        
                        // 处理图片URL
                        if (video.vod_pic) {
                            if (video.vod_pic.startsWith('//')) {
                                video.vod_pic = 'https:' + video.vod_pic
                            } else if (!video.vod_pic.startsWith('http')) {
                                video.vod_pic = appConfig.webSite.replace(/\/$/, '') + video.vod_pic
                            }
                        }
                        
                        // 清理数据
                        if (video.vod_actor === '内详') {
                            video.vod_actor = ''
                        }
                        if (video.vod_director === '内详') {
                            video.vod_director = ''
                        }
                        
                        backData.data.push(video)
                    }
                } catch (itemError) {
                    // 静默处理解析错误
                }
            })
            
            // 如果没有搜索结果，检查是否有错误提示
            if (backData.data.length === 0) {
                const errorMsg = $('.text-center.text-muted').text().trim()
                if (errorMsg.includes('没有找到')) {
                    backData.error = '没有找到相关视频'
                }
            }
            
        } else {
            backData.error = '获取搜索页失败'
        }
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}