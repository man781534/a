//@name:优质资源库
//@version:1
//@webSite:https://get.1080zyk17.com/
//@remark:高清影视资源
//@order: A02

const appConfig = {
    _webSite: 'https://get.1080zyk17.com/',
    get webSite() { return this._webSite },
    set webSite(value) { this._webSite = value },
    _uzTag: '',
    get uzTag() { return this._uzTag },
    set uzTag(value) { this._uzTag = value }
}

/**
 * 获取分类列表
 */
async function getClassList(args) {
    return JSON.stringify({
        data: [
            { type_id: '1', type_name: '电影', hasSubclass: false },
            { type_id: '2', type_name: '连续剧', hasSubclass: false },
            { type_id: '3', type_name: '综艺', hasSubclass: false },
            { type_id: '4', type_name: '动漫', hasSubclass: false },
            { type_id: '19', type_name: '福利', hasSubclass: false },
            { type_id: '83', type_name: '短剧', hasSubclass: false },
            { type_id: '94', type_name: '体育', hasSubclass: false }
        ]
    })
}

/**
 * 获取分类视频列表
 */
async function getVideoList(args) {
    var backData = new RepVideoList()
    try {
        let typeId = args.url || args.typeId || '1'
        let page = args.page || '1'
        let url = UZUtils.removeTrailingSlash(appConfig.webSite) + 
                 `/?m=vod-type-id-${typeId}-pg-${page}.html`
        
        const pro = await req(url)
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            $('.xing_vb li').each((_, li) => {
                let $li = $(li)
                let link = $li.find('.xing_vb4 a')
                if (link.length > 0) {
                    let video = new VideoDetail()
                    video.vod_id = link.attr('href')
                    video.vod_name = link.text().trim()
                    video.vod_pic = ''
                    
                    let type = $li.find('.xing_vb5').eq(0).text().trim()
                    let area = $li.find('.xing_vb5').eq(1).text().trim()
                    let update = $li.find('.xing_vb6').text().trim()
                    
                    if (type && area) video.vod_remarks = `${type} / ${area}`
                    else if (type) video.vod_remarks = type
                    if (update) video.vod_remarks += (video.vod_remarks ? ' | ' : '') + update
                    
                    if (video.vod_id && video.vod_name) {
                        if (!video.vod_id.startsWith('/')) video.vod_id = '/' + video.vod_id
                        backData.data.push(video)
                    }
                }
            })
        }
    } catch (error) {
        backData.error = '获取列表失败'
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频详情
 */
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        let url = UZUtils.removeTrailingSlash(appConfig.webSite) + args.url
        let pro = await req(url)
        
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            let vodDetail = new VideoDetail()
            vodDetail.vod_id = args.url
            vodDetail.vod_name = $('h1').text().trim() || $('title').text().split('_')[0].trim()
            vodDetail.vod_pic = $('.vodImg img.lazy').attr('src') || ''
            vodDetail.vod_content = $('.vodplayinfo').prev().text().trim()
            
            // 播放地址
            let playUrls = []
            $('input[name="copy_sel"]').each((_, input) => {
                let url = $(input).attr('value')
                if (url && url.includes('.m3u8')) playUrls.push(url.trim())
            })
            
            if (playUrls.length > 0) {
                vodDetail.vod_play_url = playUrls.map((url, i) => {
                    let name = playUrls.length === 1 ? '正片' : `第${i+1}集`
                    return name + '$' + url
                }).join('#')
            }
            
            backData.data = vodDetail
        }
    } catch (error) {
        backData.error = '获取详情失败'
    }
    return JSON.stringify(backData)
}

/**
 * 获取播放地址
 */
async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    try {
        let playUrl = args.url || ''
        if (playUrl.includes('$')) playUrl = playUrl.split('$')[1]?.trim() || playUrl
        backData.data = playUrl
    } catch (error) {
        backData.error = '播放失败'
    }
    return JSON.stringify(backData)
}

/**
 * 搜索视频（已禁用）
 */
async function searchVideo(args) {
    return JSON.stringify({
        data: [],
        error: '搜索功能因网站验证码限制暂时不可用，请使用分类浏览。'
    })
}

/**
 * 子分类列表
 */
async function getSubclassList(args) {
    return JSON.stringify({ data: [] })
}

/**
 * 子分类视频
 */
async function getSubclassVideoList(args) {
    return JSON.stringify({ data: [] })
}