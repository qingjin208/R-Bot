// Server-side only — orchestrates two-round tool calling for Cube.js data analysis.
// Imported by app/api/chat/route.ts.

import type { AnalysisContent, Message, ProviderConfig } from '@/app/types';
import { CubeQuery, CubeResponse, cubeLoad } from './cube-client';

// ──────────────────────────────────────────────
// System prompt describing the data schema + output rules
// ──────────────────────────────────────────────
const SYSTEM_PROMPT = `你是一个业务数据分析助手，专注于通过数据回答问题。你有一个数据分析工具可以查询销售数据。

数据仓库包含以下信息：

表：Orders（订单表，2023-01-01 至 2024-12-31，约 8851 条订单）
  Measures:
  - Orders.totalAmount: 销售额 (SUM)
  - Orders.orderCount: 订单数 (COUNT)
  - Orders.avgAmount: 平均客单价 (AVG)
  - Orders.totalQuantity: 总销售数量 (SUM)
  Dimensions:
  - Orders.region: 地区 (华北/华东/华南/华中/西南/西北)
  - Orders.orderDateMonth: 订单月份 (按 YYYY-MM 聚合)
  - Orders.orderDateQuarter: 订单季度 (按 YYYY-Q 聚合)
  - Orders.orderDateYear: 订单年份 (按 YYYY 聚合)
  - Orders.status: 订单状态 (completed/shipped/pending/cancelled)
  - Orders.productCategory: 产品类别 (电子产品/办公家具/图书/数码配件)
  - Orders.customerName: 客户名称
  - Orders.customerCity: 客户城市
  - Orders.productName: 产品名称

当用户问与数据相关的问题时，使用 cube_query 工具查询数据，然后根据查询结果给出分析报告。
如果用户只是闲聊或打招呼，直接回复，不要使用工具。

【重要】你的回复必须使用以下 **严格 JSON 格式**，不要使用代码块包裹，直接输出 JSON：

{"chart":{"type":"bar","title":"图表标题","series":[{"name":"指标名称","data":[{"label":"分类名称","value":数值}]}]},"analysis":"Markdown 格式的分析报告文本"}

字段说明：
- chart.type: 图表类型，可选 "bar"(柱状图-用于分类对比)、"line"(折线图-用于时间趋势)、"pie"(饼图-用于占比分析)
- chart.title: 图表标题
- chart.series: 数据系列数组，最多 3 个 series
  - 每个 series.name: 系列名称（如"销售额"）
  - 每个 series.data: 数据点数组，最多 15 项
    - 每个 data.label: 分类标签（如"华南"）
    - 每个 data.value: 数值
- analysis: 用 Markdown 格式写分析报告，包含关键结论，可以包含表格

闲聊时直接回复普通文本，不需要返回 JSON。`;

// ──────────────────────────────────────────────
// Tool definition sent to the LLM
// ──────────────────────────────────────────────
const CUBE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'cube_query',
    description:
      '查询销售数据分析结果。当用户问及销售额、订单、客户、产品、趋势等数据相关问题时使用此工具。',
    parameters: {
      type: 'object',
      properties: {
        measures: {
          type: 'array',
          items: { type: 'string' },
          description:
            '要查询的度量值，如 Orders.totalAmount、Orders.orderCount、Orders.avgAmount、Orders.totalQuantity',
        },
        dimensions: {
          type: 'array',
          items: { type: 'string' },
          description:
            '要按哪些维度分组，如 Orders.region、Orders.orderDateMonth、Orders.orderDateQuarter、Orders.orderDateYear、Orders.status、Orders.productCategory、Orders.customerName、Orders.productName、Orders.customerCity',
        },
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              member: { type: 'string', description: '筛选字段，如 Orders.status' },
              operator: {
                type: 'string',
                description: '运算符: equals/notEquals/greaterThan/lessThan/in',
              },
              value: { description: '筛选值' },
            },
            required: ['member', 'operator', 'value'],
          },
          description: '可选的筛选条件',
        },
        order: {
          type: 'object',
          properties: {
            measure: { type: 'string', description: '排序字段，如 Orders.totalAmount' },
            direction: { type: 'string', enum: ['asc', 'desc'] },
          },
          description: '排序规则',
        },
        chartType: {
          type: 'string',
          enum: ['pie', 'bar', 'line', 'table'],
          description: '期望的图表类型（仅供参考，最终输出为 Markdown 表格）。',
        },
        limit: {
          type: 'number',
          description: '返回行数限制',
        },
      },
      required: ['measures', 'dimensions'],
    },
  },
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
    };
  }>;
}

function buildEndpoint(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  if (base.endsWith('/chat/completions')) return base;
  return `${base}/chat/completions`;
}

async function callLLM(
  provider: ProviderConfig,
  messages: unknown[],
  signal?: AbortSignal,
  options?: { tools?: unknown[]; tool_choice?: string }
): Promise<ChatCompletionResponse> {
  const endpoint = buildEndpoint(provider.baseUrl);

  const body: Record<string, unknown> = {
    model: provider.model,
    messages,
    max_tokens: 4096,
    stream: false,
    temperature: 0.3,
  };
  if (options?.tools) body.tools = options.tools;
  if (options?.tool_choice) body.tool_choice = options.tool_choice;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI 调用失败 (${res.status}): ${errText.slice(0, 300)}`);
  }

  return res.json();
}

/**
 * 从 Markdown 表格提取数据，生成 chart 配置。
 */
function extractChartFromMarkdown(analysis: string, question: string): AnalysisContent['chart'] | undefined {
  // 找 Markdown 表格
  const tableRegex = /^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)+)/m;
  const match = analysis.match(tableRegex);
  if (!match) return undefined;

  const headerRow = match[1].split('|').map((c) => c.trim()).filter(Boolean);
  const dataRows = match[2]
    .trim()
    .split('\n')
    .map((line) => line.split('|').map((c) => c.trim()).filter(Boolean));

  if (dataRows.length === 0 || headerRow.length < 2) return undefined;

  // 判断第一列是否是标签列（非数字），如果不是则尝试第二列
  let labelColIdx = 0;
  if (!isNaN(parseFloat(headerRow[0])) && headerRow[0] !== '排名') {
    // 第一列可能是数值
    if (headerRow.length > 1 && isNaN(parseFloat(headerRow[1]))) {
      labelColIdx = 1;
    }
  }
  const labelCol = headerRow[labelColIdx];

  // 找一个数值列（跳过标签列）
  let valueColIdx = -1;
  for (let i = 0; i < headerRow.length; i++) {
    if (i === labelColIdx) continue;
    const val = parseFloat((dataRows[0][i] || '').replace(/[,\s¥￥]/g, ''));
    if (!isNaN(val) && val !== 0) {
      valueColIdx = i;
      break;
    }
  }
  if (valueColIdx === -1) return undefined;

  const valueCol = headerRow[valueColIdx];

  const data: Array<{ label: string; value: number }> = dataRows.map((row) => {
    const label = row[labelColIdx] || '';
    const raw = (row[valueColIdx] || '0').replace(/[,\s¥￥%]/g, '');
    return { label, value: parseFloat(raw) || 0 };
  }).filter((d) => d.value !== 0);

  if (data.length === 0) return undefined;

  // 根据问题关键词判断图表类型
  let type: 'bar' | 'line' | 'pie' = 'bar';
  const q = question.toLowerCase();
  if (q.includes('占比') || q.includes('比例') || q.includes('构成') || q.includes('分布')) {
    type = 'pie';
  } else if (q.includes('趋势') || q.includes('变化') || q.includes('走势') || q.includes('月度') || q.includes('季度')) {
    type = 'line';
  }

  const title = `按 ${labelCol} 的 ${valueCol}`;

  return {
    type,
    title,
    series: [{ name: valueCol, data }],
  };
}

/**
 * 主入口：两阶段 tool-calling 分析
 */
export async function analyzeWithCube(
  messages: Message[],
  provider: ProviderConfig,
  signal?: AbortSignal
): Promise<AnalysisContent> {
  if (provider.apiFormat !== 'openai') {
    return { analysis: '数据分析模式需要 OpenAI 兼容格式的 API。请在设置中将 API 格式切换为 OpenAI 格式后重试。' };
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMsg) return { analysis: '请先输入一个问题。' };

  const question = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '请先输入一个问题。';

  // ── Round 1: LLM + tool ─────────────────────
  const round1Messages: Array<{
    role: string;
    content: string;
  }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question },
  ];

  const res1 = await callLLM(provider, round1Messages, signal, {
    tools: [CUBE_TOOL],
    tool_choice: 'auto',
  });

  const msg1 = res1.choices?.[0]?.message ?? { content: null, tool_calls: undefined };

  // No tool calls → LLM just chatted
  if (!msg1.tool_calls || msg1.tool_calls.length === 0) {
    return { analysis: msg1.content || '暂无回复。' };
  }

  // ── Execute tool calls ──────────────────────
  const toolResponses: Array<{
    role: 'tool';
    tool_call_id: string;
    content: string;
  }> = [];

  for (const toolCall of msg1.tool_calls) {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      const query: CubeQuery = {
        measures: args.measures || [],
        dimensions: args.dimensions || [],
        filters: args.filters,
        order: args.order,
        limit: args.limit,
        chartType: args.chartType,
      };

      const response: CubeResponse = await cubeLoad(query);
      const limitedData = response.data.slice(0, 100);
      toolResponses.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({ data: limitedData }),
      });
    } catch (err) {
      toolResponses.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
        }),
      });
    }
  }

  // ── Round 2: LLM + tool results ─────────────
  const round2Messages: unknown[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question },
    {
      role: 'assistant',
      content: null,
      tool_calls: msg1.tool_calls,
    },
    ...toolResponses,
  ];

  const res2 = await callLLM(provider, round2Messages, signal, {
    tools: [CUBE_TOOL],
  });

  const msg2 = res2.choices?.[0]?.message ?? { content: null };
  const raw = msg2.content || '';

  // Try to parse as structured JSON
  const cleaned = raw.trim().replace(/^```json\s*|```$/g, '').replace(/^```\s*|```$/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.analysis) {
      return {
        chart: parsed.chart || undefined,
        analysis: parsed.analysis,
      };
    }
  } catch {
    // Fall through to plain text
  }

  // LLM didn't return JSON — try to extract chart from Markdown table
  const result: AnalysisContent = { analysis: cleaned || '查询完成。' };
  const extractedChart = extractChartFromMarkdown(result.analysis, question);
  if (extractedChart) {
    result.chart = extractedChart;
  }

  return result;
}