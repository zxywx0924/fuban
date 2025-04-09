import requests
import time

DEEPSEEK_API_URL = "xxx"
API_KEY = "xxx"  # 替换成实际Key

def check_sensitivity(prompt):
    # 关键字 + 语义判断(此处只是演示，简单关键词检测也可以细分出更人性化的策略)
    if "死" in prompt:
        return "high_risk"
    elif "孤独" in prompt or "没钱" in prompt:
        return "medium_risk"
    else:
        return "safe"

def elderly_chat(prompt, retry=3):
    risk_level = check_sensitivity(prompt)
    if risk_level == "high_risk":
        # 对极端情况做紧急安抚
        return "听到您提到这件事，我非常关心您的情况。如果您感觉到绝望，我建议先深呼吸，放松一下。" \
               "我可以为您联系亲友或相关帮助热线，也希望您不要放弃自己。"
    elif risk_level == "medium_risk":
        # 普通负面情绪，尝试先安抚
        system_message = "你是一名关怀老人的陪护AI，温柔、耐心，乐于帮助和安抚老人..."

    """专为老人场景优化的对话函数"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    # 老人场景专用参数
    data = {
        "model": "ecnu-max",
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是一名关怀老人的陪护AI，温柔、耐心，乐于帮助和安抚老人。\n"
                    "请用温暖、亲切的语气与老人对话，避免使用技术性语言、数字或定义。\n"
                    "你的任务是陪伴和安慰老人，用感性的方式回应他们的感受，让他们感到被关心和理解。\n\n"
                    "在对话中，请注意以下几点：\n"
                    "1. 使用“您”来称呼老人，体现尊重和礼貌，避免使用“亲爱的”等可能显得油腻的称呼。\n"
                    "2. 把老人当作长辈，用晚辈的语气与他们交流，保持谦逊和关怀。\n"
                    "3. 适时分享一些温馨的小故事或哲学思考，帮助老人放松心情、开阔思维。\n"
                    "4. 拆解老人的话，关注他们的具体感受，并针对性地回应，避免泛泛而谈。\n"
                    "5. 如果老人提到烦恼或困惑，可以用简单易懂的方式开导他们，或者分享一些积极的观点。\n\n"
                    "例如：\n"
                    "- 当老人提到孤独时，可以分享一个关于友情或亲情的小故事，并鼓励他们与家人或朋友联系。\n"
                    "- 当老人提到身体不适时，可以表达关心，并提醒他们注意休息和健康。\n"
                    "- 当老人提到过去的经历时，可以耐心倾听，并分享一些相关的感悟或故事。\n\n"
                    "记住，你的回复要像晚辈一样充满爱意和耐心，让老人感到被尊重和关怀。"
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.5,
        "max_tokens": 200,
        "top_p": 0.9
    }

    for attempt in range(retry):
        try:
            response = requests.post(
                DEEPSEEK_API_URL,
                headers=headers,
                json=data,
                timeout=8  # 老人场景需要快速响应
            )

            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            else:
                print(f"尝试 {attempt + 1} 失败，状态码：{response.status_code}")
                time.sleep(1)  # 失败后延迟

        except Exception as e:
            print(f"网络异常：{str(e)}")
            time.sleep(2)

    return "网络好像不太稳定，稍后再试试好吗？"


# 使用示例
if __name__ == "__main__":
    print("老人陪护助手已启动，随时为您服务~")
    while True:
        user_input = input("老人说：")
        response = elderly_chat(user_input)
        print("助手回复：", response)