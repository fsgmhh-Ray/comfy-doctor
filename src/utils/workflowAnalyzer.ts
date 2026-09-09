// src/utils/workflowAnalyzer.ts

export interface ModelDependency {
  type: "Checkpoint" | "LoRA" | "VAE" | "ControlNet" | "CLIP" | "Other";
  name: string;
  folder: string;
  nodeType: string;
}

export interface PrivacyIssue {
  nodeId: string | number;
  nodeType: string;
  type: "Path" | "ApiKey" | "Prompt";
  detail: string;
}

export interface AnalysisReport {
  totalNodes: number;
  models: ModelDependency[];
  customNodes: string[];
  privacyIssues: PrivacyIssue[];
}

// 常见官方核心节点集合（用于比对第三方自定义节点）
const OFFICIAL_NODE_TYPES = new Set([
  "KSampler", "KSamplerAdvanced", "CheckpointLoaderSimple", "CLIPTextEncode",
  "VAEDecode", "VAEEncode", "SaveImage", "PreviewImage", "LoadImage",
  "EmptyLatentImage", "ConditioningCombine", "ConditioningAverage",
  "ControlNetLoader", "ControlNetApply", "ControlNetApplyAdvanced",
  "LoraLoader", "LoraLoaderModelOnly", "VAELoader", "CLIPLoader",
  "DualCLIPLoader", "UNETLoader", "DiffusersLoader", "Note"
]);

export function analyzeWorkflow(workflow: any, prompt: any): AnalysisReport {
  const models: ModelDependency[] = [];
  const customNodesSet = new Set<string>();
  const privacyIssues: PrivacyIssue[] = [];

  // 1. 分析 UI Graph 格式的工作流 (workflow.nodes)
  if (workflow?.nodes && Array.isArray(workflow.nodes)) {
    for (const node of workflow.nodes) {
      const type = node.type || "Unknown";

      // 区分官方节点与第三方扩展
      if (!OFFICIAL_NODE_TYPES.has(type)) {
        customNodesSet.add(type);
      }

      // 模型依赖扫描
      const widgets = node.widgets_values || [];
      const nodeTypeLower = type.toLowerCase();

      if (nodeTypeLower.includes("checkpoint") || nodeTypeLower.includes("unet")) {
        const val = widgets.find((w: any) => typeof w === "string" && (w.endsWith(".safetensors") || w.endsWith(".ckpt")));
        if (val) models.push({ type: "Checkpoint", name: val, folder: "models/checkpoints/", nodeType: type });
      } else if (nodeTypeLower.includes("lora")) {
        const val = widgets.find((w: any) => typeof w === "string" && (w.endsWith(".safetensors") || w.endsWith(".ckpt")));
        if (val) models.push({ type: "LoRA", name: val, folder: "models/loras/", nodeType: type });
      } else if (nodeTypeLower.includes("vae")) {
        const val = widgets.find((w: any) => typeof w === "string" && (w.endsWith(".safetensors") || w.endsWith(".pt")));
        if (val) models.push({ type: "VAE", name: val, folder: "models/vae/", nodeType: type });
      } else if (nodeTypeLower.includes("controlnet")) {
        const val = widgets.find((w: any) => typeof w === "string" && (w.endsWith(".safetensors") || w.endsWith(".pth")));
        if (val) models.push({ type: "ControlNet", name: val, folder: "models/controlnet/", nodeType: type });
      }

      // 隐私敏感信息探测
      for (const w of widgets) {
        if (typeof w === "string") {
          // 探测绝对文件路径 (Windows: C:\... 或 Unix: /home/... /Users/...)
          if (/^[a-zA-Z]:[\\\/]|^\/(Users|home|root)[\\\/]/.test(w)) {
            privacyIssues.push({
              nodeId: node.id,
              nodeType: type,
              type: "Path",
              detail: `检测到本地绝对路径: ${w}`,
            });
          }
          // 探测 API Key (如 OpenAI 格式 sk-...)
          if (/sk-[a-zA-Z0-9]{20,}/.test(w)) {
            privacyIssues.push({
              nodeId: node.id,
              nodeType: type,
              type: "ApiKey",
              detail: `检测到内嵌 API Key: ${w.slice(0, 6)}...`,
            });
          }
        }
      }
    }
  }

  // 2. 若无 nodes 则从 prompt (API 格式) 辅助补全
  if (models.length === 0 && prompt && typeof prompt === "object") {
    for (const [id, nodeData] of Object.entries<any>(prompt)) {
      const classType = nodeData.class_type || "";
      if (!OFFICIAL_NODE_TYPES.has(classType)) {
        customNodesSet.add(classType);
      }
      const inputs = nodeData.inputs || {};
      for (const key of Object.keys(inputs)) {
        const val = inputs[key];
        if (typeof val === "string" && (val.endsWith(".safetensors") || val.endsWith(".ckpt"))) {
          models.push({
            type: key.toLowerCase().includes("lora") ? "LoRA" : "Checkpoint",
            name: val,
            folder: key.toLowerCase().includes("lora") ? "models/loras/" : "models/checkpoints/",
            nodeType: classType,
          });
        }
      }
    }
  }

  // 依赖项去重
  const uniqueModels = models.filter((m, idx, self) =>
    idx === self.findIndex((t) => t.name === m.name && t.type === m.type)
  );

  return {
    totalNodes: workflow?.nodes?.length || (prompt ? Object.keys(prompt).length : 0),
    models: uniqueModels,
    customNodes: Array.from(customNodesSet),
    privacyIssues,
  };
}