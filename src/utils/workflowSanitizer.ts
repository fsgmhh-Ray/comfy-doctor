// src/utils/workflowSanitizer.ts

export interface SanitizeOptions {
  cleanPaths: boolean;
  cleanApiKeys: boolean;
  resetSeeds: boolean;
}

/**
 * 递归/遍历清洗工作流中的敏感信息
 */
export function sanitizeWorkflowData(
  rawWorkflow: any,
  rawPrompt: any,
  options: SanitizeOptions
): { cleanedWorkflow: any; cleanedPrompt: any; cleanedCount: number } {
  let cleanedCount = 0;

  // 深拷贝，避免污染原始分析数据
  const cleanedWorkflow = rawWorkflow ? JSON.parse(JSON.stringify(rawWorkflow)) : null;
  const cleanedPrompt = rawPrompt ? JSON.parse(JSON.stringify(rawPrompt)) : null;

  const sanitizeString = (str: string): string => {
    let result = str;

    // 清洗 Windows / Unix 绝对路径
    if (options.cleanPaths && /^[a-zA-Z]:[\\\/]|^\/(Users|home|root)[\\\/]/.test(result)) {
      const parts = result.split(/[\\\/]/);
      const fileNameOrLastDir = parts[parts.length - 1] || parts[parts.length - 2] || "output";
      result = `./${fileNameOrLastDir}`;
      cleanedCount++;
    }

    // 清洗 API Key
    if (options.cleanApiKeys && /sk-[a-zA-Z0-9]{20,}/.test(result)) {
      result = "";
      cleanedCount++;
    }

    return result;
  };

  // 1. 清洗 UI Graph 结构 (workflow.nodes)
  if (cleanedWorkflow?.nodes && Array.isArray(cleanedWorkflow.nodes)) {
    for (const node of cleanedWorkflow.nodes) {
      if (Array.isArray(node.widgets_values)) {
        node.widgets_values = node.widgets_values.map((val: any, idx: number) => {
          if (typeof val === "string") {
            return sanitizeString(val);
          }
          // 重置种子值（通常带有 seed 名称或大整数）
          if (options.resetSeeds && typeof val === "number" && val > 100000000) {
            cleanedCount++;
            return 0;
          }
          return val;
        });
      }
    }
  }

  // 2. 清洗 API 结构 (prompt)
  if (cleanedPrompt && typeof cleanedPrompt === "object") {
    for (const key of Object.keys(cleanedPrompt)) {
      const nodeData = cleanedPrompt[key];
      if (nodeData?.inputs && typeof nodeData.inputs === "object") {
        for (const inputKey of Object.keys(nodeData.inputs)) {
          const val = nodeData.inputs[inputKey];
          if (typeof val === "string") {
            nodeData.inputs[inputKey] = sanitizeString(val);
          } else if (options.resetSeeds && inputKey.toLowerCase().includes("seed") && typeof val === "number") {
            nodeData.inputs[inputKey] = 0;
            cleanedCount++;
          }
        }
      }
    }
  }

  return { cleanedWorkflow, cleanedPrompt, cleanedCount };
}

/**
 * 触发浏览器本地下载
 */
export function downloadJsonFile(data: any, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}