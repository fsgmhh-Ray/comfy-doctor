// src/App.tsx
import React, { useState } from "react";
import { extractComfyMetadata } from "./utils/pngParser";
import { analyzeWorkflow, type AnalysisReport } from "./utils/workflowAnalyzer";
import { sanitizeWorkflowData, downloadJsonFile } from "./utils/workflowSanitizer";
import { 
  Upload, CheckCircle2, AlertTriangle, ShieldCheck, 
  Box, ExternalLink, HardDrive, Download, Sparkles, Search 
} from "lucide-react";

export default function App() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // 原始数据暂存
  const [rawWorkflow, setRawWorkflow] = useState<any>(null);
  const [rawPrompt, setRawPrompt] = useState<any>(null);

  // 清洗配置状态
  const [cleanPaths, setCleanPaths] = useState(true);
  const [cleanApiKeys, setCleanApiKeys] = useState(true);
  const [resetSeeds, setResetSeeds] = useState(false);
  const [cleanSuccessTip, setCleanSuccessTip] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setError(null);
    setCleanSuccessTip(null);
    setFileName(file.name);
    try {
      let workflow = null;
      let prompt = null;

      if (file.name.endsWith(".png")) {
        const meta = await extractComfyMetadata(file);
        workflow = meta.workflow;
        prompt = meta.prompt;
      } else if (file.name.endsWith(".json")) {
        const text = await file.text();
        const json = JSON.parse(text);
        if (json.nodes) workflow = json;
        else prompt = json;
      } else {
        throw new Error("请上传 .png 或 .json 格式的工作流文件。");
      }

      if (!workflow && !prompt) {
        throw new Error("该文件中未找到有效的 ComfyUI 工作流数据。");
      }

      setRawWorkflow(workflow);
      setRawPrompt(prompt);
      setReport(analyzeWorkflow(workflow, prompt));
    } catch (e: any) {
      setError(e.message || "解析失败");
      setReport(null);
    }
  };

  const handleSanitizeAndExport = () => {
    if (!rawWorkflow && !rawPrompt) return;
    const { cleanedWorkflow, cleanedPrompt, cleanedCount } = sanitizeWorkflowData(
      rawWorkflow,
      rawPrompt,
      { cleanPaths, cleanApiKeys, resetSeeds }
    );

    const exportData = cleanedWorkflow || cleanedPrompt;
    const cleanFileName = fileName.replace(/\.[^/.]+$/, "") + "_cleaned.json";
    downloadJsonFile(exportData, cleanFileName);
    setCleanSuccessTip(`已清理 ${cleanedCount} 处敏感/指定项，并导出为 ${cleanFileName}`);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* 顶部标题区 */}
      <header className="border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            ComfyDoctor <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Beta</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ComfyUI 工作流体检箱：纯前端离线依赖扫描、一键脱敏清洗与模型直达
          </p>
        </div>
        <a
          href="https://vramspace.com"
          target="_blank"
          rel="noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-500 flex items-center gap-1.5 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          显存计算器: VRAMSpace
        </a>
      </header>

      {/* 拖拽上传区 */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
        }}
        className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/40 rounded-xl p-10 text-center transition cursor-pointer"
      >
        <input
          type="file"
          accept=".png,.json"
          id="fileInput"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) processFile(e.target.files[0]);
          }}
        />
        <label htmlFor="fileInput" className="cursor-pointer space-y-3 block">
          <Upload className="w-10 h-10 mx-auto text-slate-400" />
          <div className="text-base text-slate-200 font-medium">
            拖拽 ComfyUI 图像 (.png) 或工作流 (.json) 到这里
          </div>
          <div className="text-xs text-slate-500">
            全部在本地浏览器解析，任何敏感参数、Prompt 与图片都不会离开你的电脑
          </div>
        </label>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 体检报告面板 */}
      {report && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              体检报告: {fileName}
            </h2>
            <span className="text-xs text-slate-400">共扫描 {report.totalNodes} 个节点</span>
          </div>

          {/* 一键脱敏与导出操作区 */}
          <div className="p-5 rounded-xl border border-indigo-900/50 bg-indigo-950/20 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                隐私安全脱敏与安全分享导出
              </h3>
              <button
                onClick={handleSanitizeAndExport}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-4 h-4" />
                导出脱敏后的 JSON 工作流
              </button>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cleanPaths}
                  onChange={(e) => setCleanPaths(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                />
                脱敏本地绝对路径
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cleanApiKeys}
                  onChange={(e) => setCleanApiKeys(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                />
                抹除 API 密钥
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={resetSeeds}
                  onChange={(e) => setResetSeeds(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                />
                重置随机种子为 0
              </label>
            </div>

            {cleanSuccessTip && (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {cleanSuccessTip}
              </div>
            )}
          </div>

          {/* 隐私诊断明细 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              当前风险项检测 ({report.privacyIssues.length})
            </h3>
            {report.privacyIssues.length === 0 ? (
              <p className="text-sm text-slate-400">未检测到绝对路径或 API 密钥暴露，当前工作流状态干净。</p>
            ) : (
              <div className="space-y-2">
                {report.privacyIssues.map((issue, idx) => (
                  <div key={idx} className="p-2.5 bg-red-950/30 border border-red-800/40 rounded text-xs text-red-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>节点 [{issue.nodeId} / {issue.nodeType}]: {issue.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 模型依赖清单与生态直达 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                所需模型文件 ({report.models.length})
              </h3>
              <a
                href="https://vramspace.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                前往 VRAMSpace 计算显存占用 <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {report.models.length === 0 ? (
              <p className="text-sm text-slate-400">未提取到标准模型文件引用。</p>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {report.models.map((m, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-slate-200 font-medium">{m.name}</span>
                      <span className="text-slate-500 block text-[11px] mt-0.5">目录: {m.folder}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                        {m.type}
                      </span>
                      <a
                        href={`https://civitai.com/search/models?query=${encodeURIComponent(m.name.replace(/\.[^/.]+$/, ""))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 px-2 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 transition"
                      >
                        <Search className="w-3 h-3" />
                        Civitai 检索
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 第三方扩展节点与 GitHub 检索 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Box className="w-4 h-4 text-amber-400" />
              检测到的自定义/第三方节点 ({report.customNodes.length})
            </h3>
            {report.customNodes.length === 0 ? (
              <p className="text-sm text-slate-400">工作流仅使用 ComfyUI 原生官方节点。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {report.customNodes.map((nodeName, idx) => (
                  <a
                    key={idx}
                    href={`https://github.com/search?q=${encodeURIComponent(nodeName)}+ComfyUI&type=repositories`}
                    target="_blank"
                    rel="noreferrer"
                    className="group px-2.5 py-1 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                  >
                    <span>{nodeName}</span>
                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}