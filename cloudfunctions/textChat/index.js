// textChat/index.js
const cloud = require('wx-server-sdk');
const axios = require('axios');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 自动获取当前环境ID
});

// 初始化数据库
const db = cloud.database();

exports.main = async (event, context) => {
  console.log("收到用户文本请求:", event);
  console.log("云环境信息:", cloud.DYNAMIC_CURRENT_ENV);
  
  try {
    // 获取请求参数
    const { prompt } = event;
    
    if (!prompt || typeof prompt !== 'string') {
      console.error("无效的请求参数:", prompt);
      return {
        success: false,
        error: "请提供有效的文本内容"
      };
    }
    
    // 记录请求到数据库（增加错误处理）
    try {
      const requestLog = {
        type: 'text',
        prompt: prompt,
        timestamp: new Date(),
        openid: event.userInfo && event.userInfo.openId
      };
      
      await db.collection('request_logs').add({
        data: requestLog
      });
      console.log("已记录请求到数据库");
    } catch (dbError) {
      console.error("数据库记录失败:", dbError);
      // 继续执行，不影响主流程
    }
    
    // 检查敏感内容
    const riskLevel = checkSensitivity(prompt);
    console.log("风险评估结果:", riskLevel);
    
    if (riskLevel === "high_risk") {
      const response = "听到您提到这件事，我非常关心您的情况。如果您感觉到绝望，我建议先深呼吸，放松一下。我可以为您联系亲友或相关帮助热线，也希望您不要放弃自己。";
      
      return {
        success: true,
        result: response
      };
    }
    
    // 系统提示（根据风险级别可以调整）
    let systemPrompt = "你是一名关怀老人的陪护AI，温柔、耐心，乐于帮助和安抚老人。\n" +
      "请用温暖、亲切的语气与老人对话，避免使用技术性语言、数字或定义。\n" +
      "你的任务是陪伴和安慰老人，用感性的方式回应他们的感受，让他们感到被关心和理解。\n" +
      "你是华东师范大学大模型ChatECNU。";
    
    if (riskLevel === "medium_risk") {
      systemPrompt += "\n\n请注意，用户可能正在经历一些负面情绪，请给予更多的关怀和支持。";
    }
    
    console.log("开始调用ChatECNU API");
    
    // 调用 ChatECNU API
    const response = await callChatECNUApi(prompt, [], systemPrompt);
    console.log("ChatECNU响应:", response);
    
    return {
      success: true,
      result: response
    };
  } catch (error) {
    console.error("处理请求失败:", error);
    // 返回详细的错误信息
    return {
      success: false,
      error: error.message || "服务异常，请稍后再试",
      details: error.stack || "无详细信息"
    };
  }
};

// 检查敏感内容
function checkSensitivity(prompt) {
  if (prompt.includes("死") || prompt.includes("自杀") || prompt.includes("绝望")) {
    return "high_risk";
  } else if (prompt.includes("孤独") || prompt.includes("没钱") || prompt.includes("伤心") || prompt.includes("难过")) {
    return "medium_risk";
  }
  return "safe";
}

// 调用ChatECNU API
async function callChatECNUApi(prompt, history = [], systemPrompt) {
  try {
    // 从环境变量获取API配置
    const apiKey = process.env.CHATECNU_API_KEY;
    const apiUrl = process.env.CHATECNU_API_URL || 'https://chat.ecnu.edu.cn/open/api/v1/chat/completions';
    const modelName = process.env.CHATECNU_MODEL || 'ecnu-plus';
    
    console.log("使用的API地址:", apiUrl);
    console.log("使用的模型:", modelName);
    
    if (!apiKey) {
      throw new Error("ChatECNU API密钥缺失，请配置CHATECNU_API_KEY环境变量");
    }
    
    // 构建消息数组
    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];
    
    // 添加历史对话
    if (history && history.length > 0) {
      messages.push(...history);
    }
    
    // 添加当前用户提问
    messages.push({
      role: "user",
      content: prompt
    });
    
    console.log("发送到ChatECNU的请求:", {
      model: modelName,
      messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 20) + '...' })),
      stream: false
    });
    
    const response = await axios.post(apiUrl, {
      model: modelName,
      messages: messages,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 增加超时时间到15秒
    });
    
    console.log("API状态码:", response.status);
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      console.error("API响应格式异常:", JSON.stringify(response.data));
      throw new Error("AI响应格式异常: " + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error("调用ChatECNU API完整错误:", error);
    
    // 详细记录API错误
    if (error.response) {
      console.error("API错误状态码:", error.response.status);
      console.error("API错误详情:", JSON.stringify(error.response.data));
      
      if (error.response.status === 401) {
        return "API密钥无效，请联系管理员检查密钥配置。";
      } else if (error.response.status === 429) {
        return "AI服务请求过于频繁，请稍后再试。";
      }
      
      return `AI暂时无法回应 (错误代码:${error.response.status})，请稍后再试。`;
    }
    
    // 网络错误
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      return "网络好像不太稳定，请稍后再试试。";
    }
    
    // 其他错误情况
    return "AI助手暂时无法回应，请稍后再试: " + error.message;
  }
}