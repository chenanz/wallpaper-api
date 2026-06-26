import requests, json

# 测试米游社API
url = "https://bbs-api.mihoyo.com/post/wapi/getForumPostList"
params = {"forum_id": 49, "page_size": 5, "page": 1}
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

try:
    r = requests.get(url, params=params, headers=headers, timeout=15)
    data = r.json()
    posts = data.get("data", {}).get("list", [])
    print(f"获取到 {len(posts)} 条帖子")
    
    for i, p in enumerate(posts[:3]):
        post = p.get("post", {})
        print(f"\n--- 帖子 {i+1} ---")
        print(f"标题: {post.get('subject', '')}")
        print(f"ID: {post.get('post_id')}")
        print(f"浏览量: {post.get('view_num', 0)}")
        
        # 检查图片
        cover = post.get("cover")
        images = post.get("images", [])
        print(f"cover: {cover}")
        print(f"images数量: {len(images)}")
        if images:
            print(f"第一张图: {images[0]}")
            
except Exception as e:
    print(f"错误: {e}")
