export default {
  async fetch(request, env) {

    const url = new URL(request.url);
    
    // 【绝杀拦截】只要发现请求路径里包含 rum，直接原地给它回个 204，不让它去污染网络
    if (url.pathname.includes('rum') || url.hostname.includes('telemetry')) {
      return new Response(null, { status: 204 });
    }
    
    // 1. 先尝试正常获取静态资源
    let response = await env.ASSETS.fetch(request);

    // 2. 核心修正：如果报了 404，我们需要智能判断
    if (response.status === 404) {
      const url = new URL(request.url);
      
      // 【关键拦截】如果是请求特定的 JS、CSS、图片或字体等静态文件报了 404，直接让人家 404 真实报错，拒绝乱塞 index.html
      const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|json)$/i.test(url.pathname);
      
      if (!isStaticAsset) {
        // 只有当用户直接刷新前端页面路由（比如 /json-prettify）时，才重定向给 index.html
        const indexRequest = new Request(url.origin + "/", request);
        response = await env.ASSETS.fetch(indexRequest);
      }
    }

    return response;
  }
}
