// speechToText/index.js
const cloud = require('wx-server-sdk');
const crypto = require('crypto');
const axios = require('axios');

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
    
    // 从环境变量获取配置
    const appId = process.env.XUNFEI_APP_ID;
    const apiKey = process.env.XUNFEI_API_KEY;
    const apiSecret = process.env.XUNFEI_API_SECRET;
    
    console.log("API配置检查:");
    console.log("- AppID:", appId ? "已设置" : "未设置");
    console.log("- API Key:", apiKey ? "已设置" : "未设置");
    console.log("- API Secret:", apiSecret ? "已设置" : "未设置");
    
    if (!appId || !apiKey || !apiSecret) {
      return {
        success: false,
        error: "讯飞API配置缺失"
      };
    }
    
    // 使用讯飞HTTP接口
    // API文档: https://www.xfyun.cn/doc/asr/voicedictation/API.html
    const host = "iat-api.xfyun.cn";
    const path = "/v2/iat";
    const url = `https://${host}${path}`;
    
    // 获取当前UTC时间
    const date = new Date().toUTCString();
    console.log("请求时间:", date);
    
    // 构建签名
    const signature = buildSignature(host, date, path, apiSecret);
    console.log("生成的签名:", signature.substring(0, 10) + "...");
    
    // 构建认证字符串
    const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = Buffer.from(authorizationOrigin).toString('base64');
    
    // 构建请求头
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Host": host,
      "Date": date,
      "Authorization": authorization
    };
    
    // 构建请求参数
    const requestBody = {
      common: {
        app_id: appId
      },
      business: {
        language: "zh_cn",
        domain: "iat",
        accent: "mandarin",
        dwa: "wpgs", // 开启动态修正结果
        vad_eos: 3000 // 静默检测阈值，单位毫秒
      },
      data: {
        format: "audio/wav", // 音频格式
        encoding: "raw",     // raw表示原生音频数据
        audio: base64Audio   // Base64编码的音频数据
      }
    };
    
    console.log("发送请求到讯飞API...");
    console.log("请求地址:", url);
    console.log("请求头:", JSON.stringify(headers, null, 2).substring(0, 200) + "...");
    console.log("请求体结构:", JSON.stringify({
      common: requestBody.common,
      business: requestBody.business,
      data: {
        format: requestBody.data.format,
        encoding: requestBody.data.encoding,
        audio: "BASE64_DATA_TOO_LONG_TO_PRINT"
      }
    }, null, 2));
    
    // 发送请求
    const response = await axios.post(url, requestBody, { headers });
    
    console.log("讯飞API响应状态:", response.status);
    console.log("讯飞API响应头:", JSON.stringify(response.headers));
    console.log("讯飞API响应体:", JSON.stringify(response.data));
    
    // 处理响应
    if (response.status === 200 && response.data && response.data.code === 0) {
      // 提取识别结果
      let recognizedText = "";
      
      if (response.data.data && response.data.data.result) {
        recognizedText = response.data.data.result;
      }
      
      console.log("识别结果文本:", recognizedText);
      
      return {
        success: true,
        result: recognizedText
      };
    } else {
      const errorMsg = response.data ? `错误码: ${response.data.code}, 错误信息: ${response.data.message}` : "未知错误";
      console.error("讯飞API返回错误:", errorMsg);
      
      return {
        success: false,
        error: `语音识别失败: ${errorMsg}`
      };
    }
  } catch (error) {
    console.error("语音识别处理异常:", error);
    
    let errorDetails = error.message || "未知错误";
    
    // 增强错误日志
    if (error.response) {
      console.error("HTTP状态:", error.response.status);
      console.error("响应头:", JSON.stringify(error.response.headers));
      console.error("响应体:", JSON.stringify(error.response.data));
      errorDetails = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    }
    
    return {
      success: false,
      error: `语音识别服务异常: ${errorDetails}`
    };
  }
};

// 构建签名 - 严格按照讯飞文档要求
function buildSignature(host, date, path, apiSecret) {
  // 构建签名字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  
  // 使用HMAC-SHA256生成签名
  const hmac = crypto.createHmac('sha256', apiSecret);
  hmac.update(signatureOrigin);
  return hmac.digest('base64');
}