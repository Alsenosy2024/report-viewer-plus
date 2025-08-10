import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reportId } = await req.json();

    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('section', 'mail_reports')
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found');
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        input: `أنت محلل بيانات خبير متخصص في رسائل البريد الإلكتروني والأداء التسويقي عبر الإيميل. مهمتك تحليل تقارير البريد الإلكتروني وإنشاء رؤى منظمة وقابلة للتنفيذ.
\nمهم جداً: يجب أن تكون جميع الردود باللغة العربية فقط.
\nقدّم النتيجة بصيغة JSON بهذا المخطط (القيم باللغة العربية):
{
  "executiveSummary": "ملخص تنفيذي قصير باللغة العربية",
  "performanceMetrics": [
    {"metric": "معدل الفتح", "value": "%", "trend": "positive|negative|neutral", "description": "وصف"},
    {"metric": "معدل النقر", "value": "%", "trend": "positive|negative|neutral", "description": "وصف"}
  ],
  "trendsAndPatterns": [
    {"title": "اتجاه", "description": "وصف", "impact": "high|medium|low"}
  ],
  "recommendations": [
    {"priority": "high|medium|low", "action": "إجراء", "expectedImpact": "تأثير", "timeframe": "إطار زمني"}
  ],
  "riskAssessment": {"level": "high|medium|low", "factors": ["عامل"], "mitigation": "خطة"},
  "visualSuggestions": [
    {"chartType": "نوع الرسم", "dataPoints": "نقاط البيانات", "purpose": "الغرض"}
  ]
}\n\nيرجى تحليل تقرير البريد الإلكتروني هذا وتقديم رؤى منظمة باللغة العربية:\n\n${report.content}`
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let analysisContent: string = '';
    if (data.output_text) {
      analysisContent = data.output_text;
    } else if (Array.isArray(data.output)) {
      analysisContent = data.output.map((item: any) => {
        if (Array.isArray(item?.content)) {
          return item.content.map((c: any) => c?.text ?? '').join('');
        }
        return item?.content?.[0]?.text ?? '';
      }).join('');
    } else if (data.choices?.[0]?.message?.content) {
      analysisContent = data.choices[0].message.content;
    } else {
      analysisContent = typeof data === 'string' ? data : JSON.stringify(data);
    }
    let parsedAnalysis;
    try {
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        parsedAnalysis = {
          executiveSummary: analysisContent.substring(0, 500),
          performanceMetrics: [],
          trendsAndPatterns: [],
          recommendations: [],
          riskAssessment: { overallRisk: 'medium', risks: [] },
          visualSuggestions: []
        };
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      parsedAnalysis = {
        executiveSummary: analysisContent.substring(0, 500),
        performanceMetrics: [],
        trendsAndPatterns: [],
        recommendations: [],
        riskAssessment: { overallRisk: 'medium', risks: [] },
        visualSuggestions: []
      };
    }

    const { error: updateError } = await supabase
      .from('reports')
      .update({
        content: JSON.stringify({
          original: report.content,
          analysis: parsedAnalysis,
          processedAt: new Date().toISOString(),
          processedBy: 'gpt-5'
        }),
        content_type: 'processed_analysis'
      })
      .eq('id', reportId);

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, analysis: parsedAnalysis, reportId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-mail-reports function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
