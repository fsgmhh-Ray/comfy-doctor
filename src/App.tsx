// src/App.tsx
import { useState } from "react";
import { extractComfyMetadata } from "./utils/pngParser";
import { analyzeWorkflow, type AnalysisReport } from "./utils/workflowAnalyzer";
import { sanitizeWorkflowData, downloadJsonFile } from "./utils/workflowSanitizer";
import { translations, type Lang } from "./i18n";
import { 
  Upload, CheckCircle2, AlertTriangle, ShieldCheck, 
  Box, ExternalLink, HardDrive, Download, Sparkles, Search, Languages 
} from "lucide-react";

export default function App() {
  // 默认语言为英文，并持久化到本地存储
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("comfy_doc_lang") as Lang) || "en";
  });
  const t = translations[lang];

  const handleLangToggle = () => {
    const nextLang: Lang = lang === "en" ? "zh" : "en";
    setLang(nextLang);
    localStorage.setItem("comfy_doc_lang", nextLang);
  };

  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [rawWorkflow, setRawWorkflow] = useState<any>(null);
  const [rawPrompt, setRawPrompt] = useState<any>(null);

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
        throw new Error(t.errors.invalidFile);
      }

      if (!workflow && !prompt) {
        throw new Error(t.errors.noWorkflow);
      }

      setRawWorkflow(workflow);
      setRawPrompt(prompt);
      setReport(analyzeWorkflow(workflow, prompt));
    } catch (e: any) {
      setError(t.errors.parseFailed + (e.message || ""));
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
    setCleanSuccessTip(t.cleanedSuccess(cleanedCount, cleanFileName));
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* 顶部标题栏 */}
      <header className="border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            ComfyDoctor <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Beta</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t.tagline}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 语言切换按钮 */}
          <button
            onClick={handleLangToggle}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Toggle Language / 切换语言"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang === "en" ? "中文" : "English"}</span>
          </button>

          {/* 联动 VRAMSpec */}
          <a
            href="https://vramspec.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-500 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            {t.vramLink}
          </a>
        </div>
      </header>

      {/* 拖拽上传区域 */}
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
            {t.dropzoneTitle}
          </div>
          <div className="text-xs text-slate-500">
            {t.dropzoneSub}
          </div>
        </label>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 体检与脱敏主面板 */}
      {report && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {t.reportTitle}: {fileName}
            </h2>
            <span className="text-xs text-slate-400">{t.scannedNodes} {report.totalNodes}</span>
          </div>

          {/* 脱敏操作栏 */}
          <div className="p-5 rounded-xl border border-indigo-900/50 bg-indigo-950/20 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                {t.sanitizerTitle}
              </h3>
              <button
                onClick={handleSanitizeAndExport}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-4 h-4" />
                {t.exportBtn}
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
                {t.cleanPaths}
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cleanApiKeys}
                  onChange={(e) => setCleanApiKeys(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                />
                {t.cleanApiKeys}
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={resetSeeds}
                  onChange={(e) => setResetSeeds(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                />
                {t.resetSeeds}
              </label>
            </div>

            {cleanSuccessTip && (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {cleanSuccessTip}
              </div>
            )}
          </div>

          {/* 隐私诊断 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              {t.risksTitle} ({report.privacyIssues.length})
            </h3>
            {report.privacyIssues.length === 0 ? (
              <p className="text-sm text-slate-400">{t.noRisks}</p>
            ) : (
              <div className="space-y-2">
                {report.privacyIssues.map((issue, idx) => (
                  <div key={idx} className="p-2.5 bg-red-950/30 border border-red-800/40 rounded text-xs text-red-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>{t.riskItem(issue.nodeId, issue.nodeType, issue.detail)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 算力租赁与硬件升级转化卡片 (Affiliate 商业化) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 云端一键跑图 (RunPod & Vast.ai) */}
            <div className="p-4 rounded-xl border border-indigo-900/40 bg-gradient-to-br from-indigo-950/40 to-slate-900 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
                  Cloud Compute
                </span>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  {t.cloudPromoTitle}
                </h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {t.cloudPromoDesc}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                <a
                  href="https://runpod.io?ref=4p0p3b86"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t.runpodBtn}
                </a>
                <a
                  href="https://cloud.vast.ai/?ref_id=688806"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t.vastBtn}
                </a>
              </div>
            </div>

            {/* 本地显卡升级 (Amazon Associates) */}
            <div className="p-4 rounded-xl border border-amber-900/40 bg-gradient-to-br from-amber-950/20 to-slate-900 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                  Hardware Upgrade
                </span>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  {t.amazonGpuTitle}
                </h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {t.amazonGpuDesc}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                <a
                  href="https://www.amazon.com/s?k=RTX+4070+Ti+Super+16GB&tag=vramspec-20"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-amber-800/60 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  RTX 4070 Ti Super (16GB)
                </a>
                <a
                  href="https://www.amazon.com/s?k=RTX+4090+24GB&tag=vramspec-20"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-amber-800/60 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  RTX 4090 (24GB)
                </a>
              </div>
            </div>
          </div>
          {/* 模型依赖列表 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                {t.modelsTitle} ({report.models.length})
              </h3>
              <a
                href="https://vramspec.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {t.calcVram} <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {report.models.length === 0 ? (
              <p className="text-sm text-slate-400">{t.noModels}</p>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {report.models.map((m, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-slate-200 font-medium">{m.name}</span>
                      <span className="text-slate-500 block text-[11px] mt-0.5">{t.folder} {m.folder}</span>
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
                        {t.civitaiSearch}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 第三方扩展节点 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Box className="w-4 h-4 text-amber-400" />
              {t.customNodesTitle} ({report.customNodes.length})
            </h3>
            {report.customNodes.length === 0 ? (
              <p className="text-sm text-slate-400">{t.noCustomNodes}</p>
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

      {/* GEO & SEO 语义化 Q&A 区块（动态双语） */}
      <section className="border-t border-slate-800 pt-10 mt-12 space-y-6 text-sm text-slate-400">
        <h2 className="text-base font-semibold text-slate-200">
          {t.faqTitle}
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {t.faqs.map((faq, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/80">
              <h3 className="font-medium text-slate-300 mb-1">
                {faq.q}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}