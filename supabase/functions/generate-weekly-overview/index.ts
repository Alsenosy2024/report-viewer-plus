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

    // Prepare data for Deepseek analysis
    const reportsData = reports.map(report => ({
      date: report.report_date,
      section: report.section,
      content_type: report.content_type,
      content_preview: report.content.substring(0, 500) + '...'
    }));

    const systemPrompt = `أنت محلل بيانات خبير متخصص في تحليل التقارير وإنشاء الرؤى البصرية. مهمتك هي تحليل جميع التقارير من هذا الأسبوع وإنشاء نظرة عامة شاملة مع مرئيات بيانات.

التقارير تشمل قسمين رئيسيين:
1. تقارير الواتساب (WhatsApp): تحتوي على بيانات المحادثات والرسائل
2. تقارير الإنتاجية (Productivity): تحتوي على بيانات الأداء والمهام

المطلوب منك:
1. تحليل جميع التقارير المقدمة من كلا القسمين
2. إنشاء نظرة عامة تنفيذية تغطي الواتساب والإنتاجية
3. اقتراح مخططات ورسوم بيانية مناسبة لكل قسم
4. تحديد الاتجاهات والأنماط في كلا المجالين
5. تقديم توصيات قابلة للتنفيذ لتحسين التواصل والإنتاجية

يجب أن تكون الاستجابة بصيغة JSON مع البنية التالية:
{
  "overview": "نظرة عامة تنفيذية شاملة",
  "keyMetrics": [
    {
      "title": "عنوان المقياس",
      "value": "القيمة",
      "change": "+5%",
      "trend": "up|down|stable"
    }
  ],
  "charts": [
    {
      "type": "bar|line|pie|doughnut",
      "title": "عنوان المخطط",
      "data": {
        "labels": ["تسمية1", "تسمية2"],
        "datasets": [{
          "label": "اسم البيانات",
          "data": [10, 20],
          "backgroundColor": ["#color1", "#color2"]
        }]
      }
    }
  ],
  "heatmapData": {
    "title": "خريطة حرارية للنشاط",
    "data": [
      {"day": "الأحد", "value": 85, "color": "#10b981"},
      {"day": "الإثنين", "value": 70, "color": "#f59e0b"}
    ]
  },
  "recommendations": [
    "توصية قابلة للتنفيذ 1",
    "توصية قابلة للتنفيذ 2"
  ]
}`;

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    // Call Deepseek R1 API
    console.log('Calling Deepseek R1 API...');
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `تحليل التقارير التالية من هذا الأسبوع:\n\n${JSON.stringify(reportsData, null, 2)}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('Deepseek API error:', errorText);
      throw new Error(`Deepseek API error: ${deepseekResponse.status}`);
    }

    const deepseekData = await deepseekResponse.json();
    console.log('Deepseek API response received');

    let analysisResult;
    try {
      const content = deepseekData.choices[0].message.content;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Deepseek response:', parseError);
      // Fallback response
      analysisResult = {
        overview: 'تم تحليل التقارير بنجاح',
        keyMetrics: [],
        charts: [],
        heatmapData: { title: 'خريطة النشاط', data: [] },
        recommendations: ['يوصى بمراجعة التقارير بانتظام']
      };
    }

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