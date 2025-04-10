// speechChat/index.js
const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  console.log("收到语音聊天请求");
  
  try {
    // 获取Base64编码的音频数据
    const { base64Audio } = event;
    
    if (!base64Audio) {
      return {
        success: false,
        error: "未接收到音频数据",
        recognizedText: "",
        llmResponse: "我没有听清您说的话，能请您再说一次吗？"
      };
    }
    
    // 1. 调用语音识别云函数
    console.log("调用语音识别函数...");
    const speechResult = await cloud.callFunction({
      name: 'speechToText',
      data: { base64Audio }
    });
    
    // 检查语音识别结果
    let recognizedText = "";
    if (speechResult.result && speechResult.result.success) {
      recognizedText = speechResult.result.result;
    } else {
      const errorMsg = (speechResult.result && speechResult.result.error) || "语音识别失败";
      console.error("语音识别失败:", errorMsg);
      
      return {
        success: false,
        error: errorMsg,
        recognizedText: "",
        llmResponse: "抱歉，我没能听清您的话，能请您再说一次或用文字输入吗？"
      };
    }
    
    // 如果识别文本为空
    if (!recognizedText || recognizedText.trim() === "") {
      return {
        success: true,
        recognizedText: "",
        llmResponse: "我似乎没有听到您说话，能请您再说一次吗？"
      };
    }
    
    console.log("识别结果:", recognizedText);
    
    // 2. 调用文本聊天云函数
    console.log("调用文本聊天函数...");
    const chatResult = await cloud.callFunction({
      name: 'textChat',
      data: { prompt: recognizedText }
    });
    
    // 处理文本聊天结果
    let llmResponse = "";
    if (chatResult.result && chatResult.result.success) {
      llmResponse = chatResult.result.result;
    } else {
      const errorMsg = (chatResult.result && chatResult.result.error) || "生成回复失败";
      console.error("生成回复失败:", errorMsg);
      llmResponse = "我理解了您的意思，但现在回答有点困难，能稍后再试吗？";
    }
    
    console.log("AI回复:", llmResponse);
    
    // 3. 返回完整结果
    return {
      success: true,
      recognizedText,
      llmResponse
    };
  } catch (error) {
    console.error("处理语音聊天请求异常:", error);
    return {
      success: false,
      error: error.message || "服务异常，请稍后再试",
      recognizedText: "",
      llmResponse: "抱歉，服务出现了一点小问题，请稍后再试。"
    };
  }
};