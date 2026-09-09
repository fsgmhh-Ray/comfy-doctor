// src/i18n.ts

export type Lang = "en" | "zh";

export const translations = {
  en: {
    tagline: "ComfyUI Workflow Inspector: Client-side dependency scan, privacy sanitization, and model search",
    vramLink: "VRAM Calculator: VRAMSpec",
    dropzoneTitle: "Drop ComfyUI image (.png) or workflow (.json) here",
    dropzoneSub: "100% offline client-side parsing. Prompts, paths, and images never leave your browser.",
    reportTitle: "Diagnostic Report",
    scannedNodes: "Total scanned nodes:",
    sanitizerTitle: "Privacy Sanitization & Safe Sharing",
    exportBtn: "Export Sanitized JSON",
    cleanPaths: "Sanitize absolute paths",
    cleanApiKeys: "Strip API keys",
    resetSeeds: "Reset seeds to 0",
    cleanedSuccess: (count: number, file: string) => `Cleaned ${count} sensitive/specified items, exported as ${file}`,
    risksTitle: "Detected Privacy Risks",
    noRisks: "No absolute paths or API keys detected. Workflow is clean.",
    riskItem: (id: string | number, type: string, detail: string) => `Node [${id} / ${type}]: ${detail}`,
    modelsTitle: "Required Model Dependencies",
    noModels: "No standard model file references found.",
    calcVram: "Estimate VRAM on VRAMSpec",
    folder: "Target folder:",
    civitaiSearch: "Civitai",
    customNodesTitle: "Detected Custom / Third-Party Nodes",
    noCustomNodes: "Workflow uses standard official ComfyUI nodes only.",
    faqTitle: "Frequently Asked Questions (FAQ)",
    faqs: [
      {
        q: "Does ComfyDoctor upload my images or prompts to any server?",
        a: "No. ComfyDoctor uses native Web APIs (DataView, TextDecoder) inside your browser. All file reading, metadata parsing, and JSON sanitization execute strictly on your local machine."
      },
      {
        q: "What does the workflow sanitization process remove?",
        a: "It strips local operating system absolute paths (e.g., Windows drive letters and Unix user home paths), removes exposed OpenAI/third-party API tokens, and can optionally reset seeds to prevent metadata fingerprinting."
      },
      {
        q: "How do I install missing custom nodes detected here?",
        a: "Click any detected custom node to locate its original GitHub repository. You can either clone it into your ComfyUI/custom_nodes/ directory or search its name inside ComfyUI-Manager."
      },
      {
        q: "How to estimate if my GPU can run this workflow?",
        a: "Use our companion tool VRAMSpec to calculate the required VRAM based on the model architectures (e.g., Flux, SDXL, Wan2.1) and batch sizes detected in your workflow."
      }
    ],
    errors: {
      invalidFile: "Please upload a .png image or .json workflow file.",
      noWorkflow: "No valid ComfyUI workflow metadata found in this file.",
      parseFailed: "Failed to parse file: "
    }
  },
  zh: {
    tagline: "ComfyUI 工作流体检箱：纯前端离线依赖扫描、一键脱敏清洗与模型直达",
    vramLink: "显存计算器: VRAMSpec",
    dropzoneTitle: "拖拽 ComfyUI 图像 (.png) 或工作流 (.json) 到这里",
    dropzoneSub: "全部在本地浏览器解析，任何敏感参数、Prompt 与图片都不会离开你的电脑",
    reportTitle: "体检报告",
    scannedNodes: "共扫描节点数：",
    sanitizerTitle: "隐私安全脱敏与安全分享导出",
    exportBtn: "导出脱敏后的 JSON 工作流",
    cleanPaths: "脱敏本地绝对路径",
    cleanApiKeys: "抹除 API 密钥",
    resetSeeds: "重置随机种子为 0",
    cleanedSuccess: (count: number, file: string) => `已清理 ${count} 处敏感/指定项，并导出为 ${file}`,
    risksTitle: "当前风险项检测",
    noRisks: "未检测到绝对路径或 API 密钥暴露，当前工作流状态干净。",
    riskItem: (id: string | number, type: string, detail: string) => `节点 [${id} / ${type}]: ${detail}`,
    modelsTitle: "所需模型文件",
    noModels: "未提取到标准模型文件引用。",
    calcVram: "前往 VRAMSpec 计算显存占用",
    folder: "目标目录:",
    civitaiSearch: "Civitai 检索",
    customNodesTitle: "检测到的自定义/第三方节点",
    noCustomNodes: "工作流仅使用 ComfyUI 原生官方节点。",
    faqTitle: "常见问题解答 (FAQ)",
    faqs: [
      {
        q: "ComfyDoctor 会将我的图片或 Prompt 上传到服务器吗？",
        a: "不会。ComfyDoctor 纯粹基于浏览器原生 Web API（DataView、TextDecoder）在本地执行。所有文件读取、元数据解析与 JSON 脱敏完全在本地设备完成，零网络上传。"
      },
      {
        q: "脱敏导出具体会清理掉哪些内容？",
        a: "它会自动抹除本地操作系统的绝对路径（例如 Windows 盘符路径与 Unix 用户目录），清空可能泄露的第三方 API 密钥，并可选择性地重置采样种子。"
      },
      {
        q: "如何安装检测出的缺失自定义节点？",
        a: "点击对应节点标签可直接跳转至 GitHub 对应仓库。你可以将其克隆到 ComfyUI/custom_nodes/ 目录下，或在 ComfyUI-Manager 中直接搜索安装。"
      },
      {
        q: "如何评估我的显卡能否运行此工作流？",
        a: "可通过我们的联动工具 VRAMSpec，根据检测出的基础模型架构（如 Flux、SDXL、Wan2.1）和分辨率，快速测算所需的最低显存与配置推荐。"
      }
    ],
    errors: {
      invalidFile: "请上传 .png 或 .json 格式的工作流文件。",
      noWorkflow: "该文件中未找到有效的 ComfyUI 工作流数据。",
      parseFailed: "解析失败: "
    }
  }
};