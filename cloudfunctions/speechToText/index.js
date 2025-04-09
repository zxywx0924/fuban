// speechToText/index.js
const cloud = require('wx-server-sdk');
const axios = require('axios');
const crypto = require('crypto');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  console.log("收到语音识别请求");
  
  try {
    // 获取Base64编码的音频数据
    const { base64Audio } = event;
    
    if (!base64Audio) {
      return {
        success: false,
        error: "未接收到音频数据"
      };
    }
    
    console.log("音频数据长度:", base64Audio.length);
    
    // 读取环境变量
    const appId = process.env.XUNFEI_APP_ID;
    const apiKey = process.env.XUNFEI_API_KEY;
    const apiSecret = process.env.XUNFEI_API_SECRET;
    const host = process.env.XUNFEI_API_HOST || "iat-api.xfyun.cn";
    
    if (!appId || !apiKey || !apiSecret) {
      throw new Error("讯飞API配置缺失");
    }
    
    // 构建认证URL
    const authUrl = buildXunfeiAuthUrl(host, apiKey, apiSecret);
    console.log("已构建认证URL");
    
    // 构建请求体
    const requestBody = {
      app_id: appId,
      format: 'wav', // 音频格式，可根据实际情况调整
      audio: base64Audio,
      business: {
        language: 'zh_cn', // 中文
        domain: 'iat',     // 日常用语
        accent: 'mandarin', // 普通话
        vad_eos: 3000      // 静默检测（毫秒）
      }
    };
    
    // 发送请求
    console.log("正在发送讯飞API请求...");
    const response = await axios.post(authUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15秒超时
    });
    
    // 解析结果
    console.log("讯飞API响应状态:", response.status);
    if (response.data && response.data.code === 0 && response.data.data) {
      const result = response.data.data.result || "";
      console.log("识别结果:", result);
      
      return {
        success: true,
        result: result
      };
    } else {
      console.error("讯飞API返回错误:", response.data);
      return {
        success: false,
        error: `语音识别失败: ${response.data.message || "未知错误"}`
      };
    }
  } catch (error) {
    console.error("语音识别处理异常:", error);
    return {
      success: false,
      error: error.message || "语音识别服务异常"
    };
  }
};

// 构建讯飞API认证URL
function buildXunfeiAuthUrl(host, apiKey, apiSecret) {
  const path = "/v2/iat";
  
  // 当前UTC时间
  const date = new Date().toUTCString();
  
  // 构建签名字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  
  // 使用HMAC-SHA256生成签名
  const hmac = crypto.createHmac('sha256', apiSecret);
  hmac.update(signatureOrigin);
  const signature = hmac.digest('base64');
  
  // 构建认证字符串
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  
  // 构建完整URL
  const url = `https://${host}${path}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;
  
  return url;
}