import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting weekly overview generation...');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current week start date
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Parse optional body for force regeneration flag
    let force = false;
    try {
      const payload = await req.json();
      force = Boolean(payload?.force);
    } catch (_) {
      // No JSON body provided
    }

    // Check if analysis already exists for this week
    const { data: existingAnalysis, error: analysisError } = await supabase
      .from('weekly_analyses')
      .select('*')
      .eq('week_start', weekStart.toISOString().split('T')[0])
      .single();

    if (analysisError && analysisError.code !== 'PGRST116') {
      console.error('Error checking existing analysis:', analysisError);
    }

    if (existingAnalysis && !force) {
      console.log('Found existing weekly analysis, returning cached data');
      return new Response(
        JSON.stringify({
          ...existingAnalysis.analysis_data,
          lastReportDate: existingAnalysis.created_at,
          reportsCount: existingAnalysis.reports_count,
          fromCache: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all reports from this week
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .gte('created_at', weekStart.toISOString())
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      throw new Error('Failed to fetch reports');
    }

    console.log(`Found ${reports?.length || 0} reports from this week`);

    if (!reports || reports.length === 0) {
      return new Response(
        JSON.stringify({ 
          overview: 'لم يتم العثور على تقارير هذا الأسبوع',
          charts: [],
          lastReportDate: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the last generated report date
    const lastReportDate = reports[0]?.created_at;

    // Prepare data for Deepseek analysis + compute structured metrics from input data
    const reportsData = reports.map(report => ({
      date: report.report_date,
      section: report.section,
      content_type: report.content_type,
      content_preview: (typeof report.content === 'string' ? report.content : String(report.content)).substring(0, 500) + '...'
    }));

    // Compute insights from raw input data
    const sections = ['whatsapp_reports', 'productivity_reports', 'ads_reports', 'mail_reports'] as const;
    const sectionPretty: Record<string, string> = {
      whatsapp_reports: 'الواتساب',
      productivity_reports: 'الإنتاجية',
      ads_reports: 'الإعلانات',
      mail_reports: 'البريد الإلكتروني',
    };

    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const countsBySection: Record<string, number> = { whatsapp_reports: 0, productivity_reports: 0, ads_reports: 0, mail_reports: 0 };
    const processedBySection: Record<string, number> = { whatsapp_reports: 0, productivity_reports: 0, ads_reports: 0, mail_reports: 0 };
    const dailyTotals = new Array(7).fill(0) as number[];
    const dailyBySection: Record<string, number[]> = {
      whatsapp_reports: new Array(7).fill(0),
      productivity_reports: new Array(7).fill(0),
      ads_reports: new Array(7).fill(0),
      mail_reports: new Array(7).fill(0),
    };

    for (const r of reports) {
      const sec = r.section as string;
      if (!(sec in countsBySection)) continue;
      countsBySection[sec] += 1;
      if (r.content_type === 'processed_analysis') processedBySection[sec] += 1;
      const d = new Date(r.created_at).getDay(); // 0=Sunday
      dailyTotals[d] += 1;
      dailyBySection[sec][d] += 1;
    }

    const totalReports = reports.length;
    const processedTotal = Object.values(processedBySection).reduce((a, b) => a + b, 0);
    const processingRate = totalReports === 0 ? 0 : Math.round((processedTotal / totalReports) * 100);

    const busiestDayIndex = dailyTotals.reduce((maxIdx, cur, idx, arr) => (cur > arr[maxIdx] ? idx : maxIdx), 0);
    const busiestSection = sections.reduce((maxSec, cur) => countsBySection[cur] > countsBySection[maxSec] ? cur : maxSec, sections[0]);

    // Build interactive charts based on computed data
    const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const sectionDistributionChart = {
      type: 'pie',
      title: 'توزيع التقارير حسب القسم',
      data: {
        labels: sections.map((s) => sectionPretty[s]),
        datasets: [
          {
            label: 'عدد التقارير',
            data: sections.map((s) => countsBySection[s]),
            backgroundColor: pieColors,
          },
        ],
      },
    };

    const dailyTotalsChart = {
      type: 'line',
      title: 'إجمالي التقارير لكل يوم',
      data: {
        labels: dayNames,
        datasets: [
          {
            label: 'إجمالي التقارير',
            data: [0,1,2,3,4,5,6].map((i) => dailyTotals[i])
          },
        ],
      },
    };

    const perSectionDailyCharts = sections.map((s, idx) => ({
      type: 'bar' as const,
      title: `عدد تقارير ${sectionPretty[s]} لكل يوم`,
      data: {
        labels: dayNames,
        datasets: [
          {
            label: sectionPretty[s],
            data: [0,1,2,3,4,5,6].map((i) => dailyBySection[s][i]),
            backgroundColor: pieColors[idx % pieColors.length],
          },
        ],
      },
    }));

    const maxDaily = Math.max(...dailyTotals, 0);
    const heatmapData = {
      title: 'خريطة النشاط خلال الأسبوع',
      data: dayNames.map((day, i) => {
        const valuePct = maxDaily === 0 ? 0 : Math.round((dailyTotals[i] / maxDaily) * 100);
        // simple green->orange scale
        const color = valuePct > 66 ? '#10b981' : valuePct > 33 ? '#f59e0b' : '#93c5fd';
        return { day, value: valuePct, color };
      })
    };

    const computedKeyMetrics = [
      { title: 'إجمالي التقارير', value: String(totalReports), change: undefined, trend: 'stable' },
      { title: 'نسبة المعالجة بالذكاء الاصطناعي', value: `${processingRate}%`, change: undefined, trend: processingRate >= 50 ? 'up' : 'down' },
      { title: 'أكثر يوم نشاطاً', value: dayNames[busiestDayIndex] || 'غير محدد', change: undefined, trend: 'stable' },
      { title: 'أكثر قسم نشاطاً', value: sectionPretty[busiestSection], change: undefined, trend: 'up' },
    ];

    const computedCharts = [sectionDistributionChart, dailyTotalsChart, ...perSectionDailyCharts];

    const fallbackOverview = `تم تحليل ${totalReports} تقرير هذا الأسبوع مع توزيع واضح بين الأقسام الأربعة، وبلغت نسبة التقارير المعالجة بالذكاء الاصطناعي ${processingRate}%. كان يوم ${dayNames[busiestDayIndex]} الأكثر نشاطاً.`;
    const systemPrompt = `أنت محلل بيانات خبير متخصص في تحليل التقارير متعددة الأقسام وإنشاء رؤى تنفيذية مدعومة بمرئيات.

التقارير تشمل أربعة أقسام رئيسية:
1) تقارير الواتساب (whatsapp_reports): بيانات المحادثات ونشاط الرسائل
2) تقارير الإنتاجية (productivity_reports): الأداء، المهام، الالتزام
3) تحليلات الإعلانات (ads_reports): الإنفاق، النتائج، العائد
4) تقارير البريد الإلكتروني (mail_reports): الفتح، النقر، التحويلات

المطلوب:
- تحليل جميع تقارير هذا الأسبوع عبر الأقسام الأربعة
- تقديم نظرة عامة تنفيذية شاملة + ملخصات لكل قسم مع أهم المقاييس
- إنشاء مخططات مناسبة (Bar/Line/Pie/Doughnut) حسب البيانات المتاحة لكل قسم
- استخراج اتجاهات مشتركة بين الأقسام (cross-section insights)
- تقديم توصيات قابلة للتنفيذ قصيرة وواضحة

صيغة الاستجابة يجب أن تكون JSON بالعربية حصراً وبالبنية التالية:
{
  "overview": "نظرة عامة تنفيذية شاملة بالعربية",
  "sections": {
    "whatsapp_reports": {
      "summary": "ملخص القسم",
      "keyMetrics": [{"title": "مقياس", "value": "قيمة", "change": "+%", "trend": "up|down|stable"}],
      "charts": [
        {"type": "bar|line|pie|doughnut", "title": "عنوان", "data": {"labels": ["..."], "datasets": [{"label": "...", "data": [..], "backgroundColor": ["#..."]}]}}
      ]
    },
    "productivity_reports": { "summary": "...", "keyMetrics": [], "charts": [] },
    "ads_reports": { "summary": "...", "keyMetrics": [], "charts": [] },
    "mail_reports": { "summary": "...", "keyMetrics": [], "charts": [] }
  },
  "keyMetrics": [
    {"title": "مؤشر إجمالي هام", "value": "قيمة", "change": "+-%", "trend": "up|down|stable"}
  ],
  "charts": [
    {"type": "bar|line|pie|doughnut", "title": "مخطط عام", "data": {"labels": ["..."], "datasets": [{"label": "...", "data": [..]}]}}
  ],
  // بيانات اختيارية لخريطة الحرارة إن أمكن
  "heatmapData": {
    "title": "خريطة حرارية للنشاط",
    "data": [
      {"day": "الأحد", "value": 0, "color": "#10b981"}
    ]
  },
  "recommendations": ["توصية 1", "توصية 2"],
  "crossSectionInsights": ["استنتاج مشترك بين الأقسام"]
}`;

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Call OpenAI GPT-5 Responses API
    console.log('Calling OpenAI GPT-5 Responses API...');
    const aiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        input: `${systemPrompt}\n\nحلّل التقارير التالية من هذا الأسبوع (JSON):\n\n${JSON.stringify(reportsData)}`
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('OpenAI API response received');

    // Parse response content and extract JSON structure
    let llm: any = null;
    try {
      let contentText = '';
      if (aiData.output_text) {
        contentText = aiData.output_text;
      } else if (Array.isArray(aiData.output)) {
        contentText = aiData.output.map((item: any) => {
          if (Array.isArray(item?.content)) {
            return item.content.map((c: any) => c?.text ?? '').join('');
          }
          return item?.content?.[0]?.text ?? '';
        }).join('');
      } else if (aiData.choices?.[0]?.message?.content) {
        contentText = aiData.choices[0].message.content;
      }
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        llm = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
    }

    const analysisResult = {
      overview: (llm?.overview) ?? fallbackOverview,
      keyMetrics: [...computedKeyMetrics, ...(llm?.keyMetrics ?? [])],
      charts: [...computedCharts, ...(llm?.charts ?? [])],
      heatmapData: (llm?.heatmapData && llm.heatmapData.data?.length ? llm.heatmapData : heatmapData),
      recommendations: llm?.recommendations ?? [],
      sections: llm?.sections,
      crossSectionInsights: llm?.crossSectionInsights,
    };

    // Store the analysis in the database
    let dbError: any = null;
    if (existingAnalysis) {
      const { error } = await supabase
        .from('weekly_analyses')
        .update({
          analysis_data: analysisResult,
          reports_count: reports.length,
          week_start: weekStartStr,
        })
        .eq('id', existingAnalysis.id);
      dbError = error;
    } else {
      const { error } = await supabase
        .from('weekly_analyses')
        .insert({
          week_start: weekStartStr,
          analysis_data: analysisResult,
          reports_count: reports.length
        });
      dbError = error;
    }

    if (dbError) {
      console.error('Error storing analysis:', dbError);
      // Continue anyway, return the analysis even if storage fails
    }

    // Add last report date to the response
    const response = {
      ...analysisResult,
      lastReportDate,
      reportsCount: reports.length,
      fromCache: false
    };

    console.log('Weekly overview generated and stored successfully');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-weekly-overview function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate weekly overview', 
        details: error.message,
        overview: 'حدث خطأ في تحليل التقارير',
        charts: [],
        lastReportDate: null
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});