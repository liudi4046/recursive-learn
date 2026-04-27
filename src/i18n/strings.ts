/**
 * English UI strings. Chinese (`zh`) must mirror every key.
 */
const en = {
  // Brand (header, metadata)
  brandName: "Recursive Learn",

  // Nav & shell
  navLearningMap: "Sessions",
  navSearch: "Search",
  navSettings: "Settings",
  navLanguage: "Language",
  langEnglish: "English",
  langChinese: "中文",
  /** Language name for the English option in the header menu (use “英文” in Chinese UI). */
  localeMenuEnglish: "English",

  // Home
  homeHeroTitle: "Learn the recursive way",
  homeSubtitle:
    "Start from any topic, keep asking about what you don’t understand, and mark whether you’ve mastered each part. Keep going until it’s clear—your question tree is saved to revisit.",
  homeContinue: "Continue where you left off",
  homeTopicAria: "Learning topic",
  homeTopicPlaceholder: "What do you want to learn?",
  homeStart: "Start learning",
  homeWebSearchAria: "Web search",
  homeWebSearchTitle: "Web search",
  homeDemo1Title: "Transformer",
  homeDemo1BodyBefore1: "A deep learning architecture built on ",
  homeDemo1BodyEm1: "self-attention mechanisms",
  homeDemo1BodyMid: "; it uses ",
  homeDemo1BodyEm2: "positional encoding",
  homeDemo1BodyAfter: " so the model knows token order without recurrence.",
  homeDemo2Title: "Self-attention",
  homeDemo2BodyBefore: "Uses ",
  homeDemo2BodyEm: "Q, K, V",
  homeDemo2BodyAfter: " linear projections to compare tokens.",
  homeDemo3Title: "Q/K/V",
  homeDemo3Body:
    "Queries, Keys, and Values are three learned linear projections used in attention scoring.",
  homeDemo4Title: "Positional Encoding",
  homeDemo4Body: "Adds order information because attention alone is permutation-invariant.",

  // Settings
  settingsTitle: "Settings",
  settingsIntro:
    "Add API keys for the model provider you use, plus optional web search keys. Keys stay in this browser and are sent to this app’s server when you ask a question, then to the selected provider. On the server you can also set the same keys via environment variables. Do not use on a shared device unless you clear them when done.",
  settingsLlmProvider: "LLM provider",
  settingsModelName: "Model name",
  settingsModelHint:
    "Leave blank to use this provider’s default ({{default}}). You can paste any model id your account supports.",
  settingsApiKeyPlaceholder: "Required unless the same key is set on the server (env)",
  settingsKeySwitchHint:
    "Only the key for the provider you selected above is shown; other providers’ keys stay saved if you already entered them—switch provider to edit another.",
  settingsWebSearchProvider: "Web search provider",
  settingsSave: "Save",
  settingsClearKeys: "Clear keys",
  settingsSaved: "Saved.",
  settingsTavilyKey: "Tavily API key",
  settingsBraveKey: "Brave Search API key",
  settingsExaKey: "Exa API key",
  settingsDataManagement: "Data management",
  settingsDataIntro:
    "Your learning sessions (recursive question trees) are stored in this browser with IndexedDB. Export a JSON backup before clearing browser site data, switching devices, or using a different browser.",
  settingsExportJson: "Export JSON",
  settingsImportJson: "Import JSON backup",
  settingsExported: "Exported backup.",
  settingsImported: "Imported backup.",
  settingsExportFailed: "Export failed",
  settingsImportFailed: "Import failed",

  llmKeyOpenai: "OpenAI API key",
  llmKeyGemini: "Gemini / Google AI API key",
  llmKeyClaude: "Anthropic API key",
  llmKeyDeepseek: "DeepSeek API key",
  llmKeyKimi: "Moonshot (Kimi) API key",
  llmKeyGlm: "Zhipu (GLM) API key",
  llmKeyQwen: "DashScope (Qwen) API key",
  llmKeyMinimax: "MiniMax API key",

  llmHintOpenai: "API key from platform.openai.com; uses the OpenAI Chat Completions API.",
  llmHintGemini: "API key from Google AI Studio; uses the OpenAI-compatible endpoint.",
  llmHintClaude: "API key from Anthropic Console; uses the Messages API.",
  llmHintDeepseek: "API key from DeepSeek; OpenAI-compatible base URL.",
  llmHintKimi: "API key from Moonshot; OpenAI-compatible endpoint.",
  llmHintGlm: "API key from Zhipu Open Platform; OpenAI-compatible v4 endpoint.",
  llmHintQwen: "API key from Alibaba DashScope; compatible-mode OpenAI endpoint.",
  llmHintMinimax: "API key from MiniMax; OpenAI-compatible international endpoint.",

  webHintExa: "Exa neural search API (x-api-key from dashboard.exa.ai).",
  webHintTavily: "Search API optimized for LLM context.",
  webHintBrave: "Brave Web Search API (subscription token).",

  // Maps index
  mapsBreadcrumb: "Sessions",
  mapsTitle: "Your root nodes",
  mapsSubtitle:
    "Choose a root to open its question tree: all nodes and follow-ups from that point are part of the same session.",
  mapsNewRootAria: "New root node",
  mapsCreateRoot: "Create new root node",
  mapsNoRoots: "Create your first root node to start recursive learning.",
  mapsNoAnswer: "No answer yet",
  mapsDeleteMapTitle: "Delete session",
  mapsOpenMap: "Open session: {{title}}",
  mapsPagination: "Session list",
  mapsPagePrev: "Previous",
  mapsPageNext: "Next",
  mapsPageOf: "Page {{current}} of {{total}}",
  confirmDeleteMapTitle: "Delete session?",
  confirmDeleteMapBody:
    "The root and all nodes under it will be removed. This action cannot be undone.",
  confirmDeleteMapOk: "Delete session",

  // Search
  searchTitle: "Search",
  searchNoSession: "No learning session.",
  searchStartHome: "Start from home",
  searchHeading: "Search nodes",
  searchDescription:
    "Find nodes by title, session Q&A, one-off questions, and reference snippets. Results open the node detail view.",
  searchPlaceholder: "Search by keyword…",
  searchNodesAria: "Search nodes",
  searchKeywordHint: "Type a keyword to search across all sessions.",
  searchNoMatch: "No nodes match that keyword.",
  searchMapFallback: "Session",
  searchRoot: "root",
  searchMastered: "mastered",
  searchUnmastered: "unmastered",
  searchOpen: "Open",

  // Node detail
  nodeSessionIncomplete: "Session incomplete.",
  nodeJustAskLog: "Just ask log",
  nodeJustAskEmpty:
    "No just-ask entries on this node yet. Use “Just ask” below to add standalone Q&A.",
  nodeJustAskCurrent: "Current",
  nodeTitleGenerating: "Generating title",
  nodeThinking: "Thinking…",
  nodeMastery: "Mastery",
  nodeUnmastered: "Unmastered",
  nodeMastered: "Mastered",
  nodeDelete: "Delete node",
  nodeLearningTrace: "Learning trace",
  nodeFullMap: "Full tree",
  nodeAddAsChild: "Add as child node",
  nodeJustAskLabel: "Just ask",
  nodeAskQuestion: "Ask a question",
  nodeNextPlaceholder: "What do you want to learn next?",
  nodeCreateChild: "Create child node",
  nodeJustAskMode: "Just ask",
  nodeAnswerTarget: "Where to put the answer",
  nodeSubmitCreateChild: "Submit to create child node",
  nodeSubmitJustAsk: "Submit to just ask",
  nodeUnexpectedResponse: "Unexpected response",
  nodeUnexpectedStream: "Unexpected stream",
  nodeRequestFailed: "Request failed",
  askLlmKeyRequired:
    "Add an LLM API key in Settings for your chosen provider (or set the matching key on the server), then try again.",
  askWebSearchExaKeyRequired:
    "EXA_API_KEY is required when using Exa for web search. Add it in Settings or set the EXA_API_KEY environment variable on the server.",
  askWebSearchBraveKeyRequired:
    "BRAVE_API_KEY is required when using Brave for web search. Add it in Settings or set the BRAVE_API_KEY environment variable on the server.",
  askWebSearchTavilyKeyRequired:
    "TAVILY_API_KEY is required when using Tavily for web search. Add it in Settings or set the TAVILY_API_KEY environment variable on the server.",
  askQuestionRequired: "Question is required",
  askStreamOnly: "This endpoint only supports streaming. Set stream: true in the request body.",
  askInvalidMode: "Invalid request mode",
  askWebSearchFailed: "Web search failed",
  nodeDeleteTitle: "Delete node?",
  nodeDeleteBody:
    "This node and all nodes beneath it will be removed. This action cannot be undone.",
  nodeErrorGeneric: "Something went wrong",

  // Full-session tree view
  mapNoSession: "No session in this workspace.",
  mapSearchNodes: "Search nodes",
  mapSearchPlaceholder: "Search nodes…",
  mapSelectedPanel: "Selected node",
  mapClosePanel: "Close panel",
  mapAnswerPreview: "Answer preview",
  mapNoAnswerYet: "No answer yet.",
  mapMasteryGroup: "Mastery (selection)",
  mapOpenNode: "Open node",
  mapMapDeleteNode: "Delete node",
  mapShowDetails: "Show node details",
  mapDeleteTitle: "Delete node?",
  mapDeleteBody:
    "This node and all nodes beneath it will be removed. This action cannot be undone.",
  mapDeleteOk: "Delete node",
  mapRouteMissingRoot: "That session isn’t in your browser data.",
  mapRouteBackSessions: "Back to all sessions",
  mapRouteOr: "or",
  mapRouteHome: "home",

  // Q / A block labels
  qaLabelQuestion: "Question",
  qaLabelYourQuestion: "Your question",
  qaLabelAnswer: "Answer",

  // Web sources
  webRefAria: "Web search references",
  webRefTitle: "Web references",
  webRefCount: "· {{count}} sources",
  webRefNoSnippets: "· no snippets",
  webRefExpand: "Expand",
  webRefCollapse: "Collapse",
  webRefNoSummary:
    "Searched the web for your question; there are no page snippets available. The answer may still use retrieval context.",
  webRefNoTitle: "Untitled",

  // Tree view
  treeTopic: "Topic tree",
  treeZoom: "Tree zoom",
  treeZoomOut: "Zoom out",
  treeZoomIn: "Zoom in",
  treePath: "Path from root to this node",
  treeNoMatch: "No nodes match your search or filter.",
  treeNoPath: "No path to show.",
  treeReset: "Reset",

  // Dialog
  dialogClose: "Close dialog",
  dialogCancel: "Cancel",
  dialogDelete: "Delete"
} as const;

const zh: { [K in keyof typeof en]: string } = {
  brandName: "递归学习",
  navLearningMap: "学习会话",
  navSearch: "搜索",
  navSettings: "设置",
  navLanguage: "语言",
  langEnglish: "English",
  langChinese: "中文",
  localeMenuEnglish: "英文",

  homeHeroTitle: "用递归法学习",
  homeSubtitle:
    "从任意主题开始，对不懂处继续提问并标记是否掌握，一路追问直到理解；问题树会保存，方便随时返回。",
  homeContinue: "继续上次的节点",
  homeTopicAria: "学习主题",
  homeTopicPlaceholder: "想学什么？",
  homeStart: "开始学习",
  homeWebSearchAria: "联网搜索",
  homeWebSearchTitle: "联网搜索",
  homeDemo1Title: "Transformer",
  homeDemo1BodyBefore1: "基于",
  homeDemo1BodyEm1: "自注意力机制",
  homeDemo1BodyMid: "的深度学习结构；用",
  homeDemo1BodyEm2: "位置编码",
  homeDemo1BodyAfter: "在无循环网络里表示 token 顺序。",
  homeDemo2Title: "自注意力",
  homeDemo2BodyBefore: "通过",
  homeDemo2BodyEm: "Q、K、V",
  homeDemo2BodyAfter: "三个可学习投影计算注意力权重。",
  homeDemo3Title: "Q/K/V",
  homeDemo3Body: "查询、键、值是输入向量的线性投影，用于注意力打分。",
  homeDemo4Title: "位置编码",
  homeDemo4Body: "为注意力提供顺序信息，否则词序会被忽略。",

  settingsTitle: "设置",
  settingsIntro:
    "为你使用的模型和可选的联网搜索配置 API 密钥。密钥保存在本机浏览器，提问时会发送到本应用的服务器，再转发到所选供应商。你也可在服务器上通过环境变量设置相同密钥。在共享设备上使用后请及时清除。",
  settingsLlmProvider: "大语言模型",
  settingsModelName: "模型名称",
  settingsModelHint:
    "留空则使用该供应商默认模型（{{default}}）。可填写你账号支持任意模型 ID。",
  settingsApiKeyPlaceholder: "一般必填；若服务器已配置同名校验环境变量可留空",
  settingsKeySwitchHint: "只显示当前所选供应商的密钥；已保存的其它厂商密钥在切换后仍可编辑。",
  settingsWebSearchProvider: "联网搜索供应商",
  settingsSave: "保存",
  settingsClearKeys: "清除密钥",
  settingsSaved: "已保存。",
  settingsTavilyKey: "Tavily API 密钥",
  settingsBraveKey: "Brave Search API 密钥",
  settingsExaKey: "Exa API 密钥",
  settingsDataManagement: "数据管理",
  settingsDataIntro:
    "学习会话（递归问题树）通过 IndexedDB 存在本机浏览器。清理站点数据、换机或换浏览器前，请先导出 JSON 备份。",
  settingsExportJson: "导出 JSON",
  settingsImportJson: "导入 JSON 备份",
  settingsExported: "已导出备份。",
  settingsImported: "已导入备份。",
  settingsExportFailed: "导出失败",
  settingsImportFailed: "导入失败",

  llmKeyOpenai: "OpenAI API 密钥",
  llmKeyGemini: "Gemini / Google AI API 密钥",
  llmKeyClaude: "Anthropic API 密钥",
  llmKeyDeepseek: "DeepSeek API 密钥",
  llmKeyKimi: "Moonshot（Kimi）API 密钥",
  llmKeyGlm: "智谱（GLM）API 密钥",
  llmKeyQwen: "DashScope（通义千问）API 密钥",
  llmKeyMinimax: "MiniMax API 密钥",

  llmHintOpenai: "来自 platform.openai.com 的 API 密钥；使用 OpenAI Chat Completions API。",
  llmHintGemini: "来自 Google AI Studio 的 API 密钥；使用兼容 OpenAI 的端点。",
  llmHintClaude: "来自 Anthropic 控制台的 API 密钥；使用 Messages API。",
  llmHintDeepseek: "来自 DeepSeek 的 API 密钥；兼容 OpenAI 的 base URL。",
  llmHintKimi: "来自月之暗面 Moonshot 的 API 密钥；兼容 OpenAI 的端点。",
  llmHintGlm: "来自智谱开放平台的 API 密钥；兼容 OpenAI 的 v4 端点。",
  llmHintQwen: "来自阿里云 DashScope 的 API 密钥；兼容模式 OpenAI 端点。",
  llmHintMinimax: "来自 MiniMax 的 API 密钥；国际站兼容 OpenAI 端点。",

  webHintExa: "Exa 神经搜索 API（在 dashboard.exa.ai 使用 x-api-key）。",
  webHintTavily: "面向大模型上下文的搜索 API。",
  webHintBrave: "Brave Web Search API（订阅令牌）。",

  mapsBreadcrumb: "学习会话",
  mapsTitle: "根节点",
  mapsSubtitle: "选择根节点可打开自该点向下的问题树，追问与子节点同属于一个学习会话。",
  mapsNewRootAria: "新根节点",
  mapsCreateRoot: "新建根节点",
  mapsNoRoots: "先创建一个根节点，开始你的递归学习。",
  mapsNoAnswer: "尚无回答",
  mapsDeleteMapTitle: "删除会话",
  mapsOpenMap: "打开会话：{{title}}",
  mapsPagination: "会话列表",
  mapsPagePrev: "上一页",
  mapsPageNext: "下一页",
  mapsPageOf: "第 {{current}} / {{total}} 页",
  confirmDeleteMapTitle: "删除会话？",
  confirmDeleteMapBody: "将删除该根及其下所有节点，此操作无法撤销。",
  confirmDeleteMapOk: "删除会话",

  searchTitle: "搜索",
  searchNoSession: "当前没有学习会话。",
  searchStartHome: "从首页开始",
  searchHeading: "搜索节点",
  searchDescription:
    "在标题、会话中的问答、随便问问和引用片段中搜索。结果将打开对应节点。",
  searchPlaceholder: "按关键词搜索…",
  searchNodesAria: "搜索节点",
  searchKeywordHint: "输入关键词，在所有学习会话中查找。",
  searchNoMatch: "没有节点匹配该关键词。",
  searchMapFallback: "学习会话",
  searchRoot: "根",
  searchMastered: "已掌握",
  searchUnmastered: "未掌握",
  searchOpen: "打开",

  nodeSessionIncomplete: "会话数据不完整。",
  nodeJustAskLog: "随便问问 记录",
  nodeJustAskEmpty: "该节点暂无疑问。使用下方「随便问问」可留下独立问答。",
  nodeJustAskCurrent: "当前随便问问",
  nodeTitleGenerating: "标题生成中",
  nodeThinking: "正在思考中",
  nodeMastery: "掌握度",
  nodeUnmastered: "未掌握",
  nodeMastered: "已掌握",
  nodeDelete: "删除节点",
  nodeLearningTrace: "学习路径",
  nodeFullMap: "整棵树",
  nodeAddAsChild: "加为子节点",
  nodeJustAskLabel: "随便问问",
  nodeAskQuestion: "提问",
  nodeNextPlaceholder: "接下来想学什么？",
  nodeCreateChild: "新建子节点",
  nodeJustAskMode: "随便问问",
  nodeAnswerTarget: "回答放在哪里",
  nodeSubmitCreateChild: "提交并生成子节点",
  nodeSubmitJustAsk: "提交为随便问问",
  nodeUnexpectedResponse: "意外响应",
  nodeUnexpectedStream: "意外的流式响应",
  nodeRequestFailed: "请求失败",
  askLlmKeyRequired:
    "请在设置中为你选择的大模型提供商填写 API 密钥（或在服务器上配置对应环境变量），然后再试。",
  askWebSearchExaKeyRequired:
    "使用 Exa 联网搜索时需要配置 Exa 的 API 密钥。请在「设置」中填写，或在服务器上设置环境变量 EXA_API_KEY。",
  askWebSearchBraveKeyRequired:
    "使用 Brave 联网搜索时需要配置 Brave 的 API 密钥。请在「设置」中填写，或在服务器上设置环境变量 BRAVE_API_KEY。",
  askWebSearchTavilyKeyRequired:
    "使用 Tavily 联网搜索时需要配置 Tavily 的 API 密钥。请在「设置」中填写，或在服务器上设置环境变量 TAVILY_API_KEY。",
  askQuestionRequired: "问题不能为空。",
  askStreamOnly: "本接口只支持流式，请在请求体中设置 stream: true。",
  askInvalidMode: "无效的请求模式。",
  askWebSearchFailed: "联网搜索失败",
  nodeDeleteTitle: "删除节点？",
  nodeDeleteBody: "将删除此节点及其下所有子节点，此操作无法撤销。",
  nodeErrorGeneric: "出错了",

  mapNoSession: "当前工作区没有该学习会话。",
  mapSearchNodes: "搜索节点",
  mapSearchPlaceholder: "搜索节点…",
  mapSelectedPanel: "已选节点",
  mapClosePanel: "关闭侧栏",
  mapAnswerPreview: "回答摘要",
  mapNoAnswerYet: "还没有回答。",
  mapMasteryGroup: "掌握度（本节点）",
  mapOpenNode: "打开节点",
  mapMapDeleteNode: "删除节点",
  mapShowDetails: "显示节点详情",
  mapDeleteTitle: "删除节点？",
  mapDeleteBody: "将删除此节点及其下所有子节点，此操作无法撤销。",
  mapDeleteOk: "删除节点",
  mapRouteMissingRoot: "当前数据中没有该学习会话。",
  mapRouteBackSessions: "返回全部会话",
  mapRouteOr: "或",
  mapRouteHome: "首页",

  qaLabelQuestion: "问题",
  qaLabelYourQuestion: "你的问题",
  qaLabelAnswer: "回答",

  webRefAria: "网络引用",
  webRefTitle: "联网参考",
  webRefCount: "· {{count}} 条",
  webRefNoSnippets: "· 无摘要",
  webRefExpand: "展开",
  webRefCollapse: "收起",
  webRefNoSummary:
    "已根据你的问题联网检索；当前没有可用的页面摘要。回答仍可能结合在线检索的上下文。",
  webRefNoTitle: "无标题",

  treeTopic: "主题树",
  treeZoom: "树图缩放",
  treeZoomOut: "缩小",
  treeZoomIn: "放大",
  treePath: "从根到该节点的路径",
  treeNoMatch: "没有符合搜索或筛选的节点。",
  treeNoPath: "没有可显示的路径。",
  treeReset: "重置",

  dialogClose: "关闭对话框",
  dialogCancel: "取消",
  dialogDelete: "删除"
};

export type AppLocale = "en" | "zh";
export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

export const MESSAGES: Record<AppLocale, Messages> = { en, zh };

export function formatMessage(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
    k in vars ? String(vars[k as keyof typeof vars]) : `{{${k}}}`
  );
}
