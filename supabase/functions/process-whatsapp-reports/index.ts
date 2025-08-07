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
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not found in environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the report ID from request
    const { reportId } = await req.json();
    
    // Fetch the specific report
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('section', 'whatsapp_reports')
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found');
    }

    // Process with Deepseek R1
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: `أنت محلل بيانات خبير متخصص في اتصالات واتساب التجارية. مهمتك هي تحليل تقارير واتساب وإنشاء رؤى جميلة ومنظمة وقابلة للتنفيذ باللغة العربية.

لكل تقرير، قدم:
1. **الملخص التنفيذي** - النقاط الرئيسية في 2-3 جمل
2. **مقاييس الأداء** - استخراج وإبراز الأرقام المهمة
3. **الاتجاهات والأنماط** - تحديد الاتجاهات المهمة
4. **التوصيات القابلة للتنفيذ** - 3-5 توصيات محددة
5. **تقييم المخاطر** - أي مشاكل أو مخاوف محتملة
6. **اقتراحات البيانات المرئية** - اقتراح أنواع الرسوم البيانية للمقاييس الرئيسية

قم بتنسيق إجابتك كـ JSON منظم مع المخطط التالي:
{
  "executiveSummary": "ملخص تنفيذي باللغة العربية",
  "performanceMetrics": [
    {
      "metric": "اسم المقياس باللغة العربية",
      "value": "القيمة",
      "trend": "positive|negative|neutral",
      "description": "وصف باللغة العربية"
    }
  ],
  "trendsAndPatterns": [
    {
      "title": "عنوان الاتجاه باللغة العربية",
      "description": "وصف باللغة العربية",
      "impact": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "إجراء باللغة العربية",
      "expectedImpact": "التأثير المتوقع باللغة العربية",
      "timeframe": "الإطار الزمني باللغة العربية"
    }
  ],
  "riskAssessment": {
    "overallRisk": "high|medium|low",
    "risks": [
      {
        "risk": "المخاطرة باللغة العربية",
        "severity": "high|medium|low",
        "mitigation": "استراتيجية التخفيف باللغة العربية"
      }
    ]
  },
  "visualSuggestions": [
    {
      "chartType": "نوع الرسم البياني باللغة العربية",
      "dataPoints": "نقاط البيانات باللغة العربية",
      "purpose": "الغرض باللغة العربية"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `يرجى تحليل تقرير واتساب هذا وتقديم رؤى منظمة باللغة العربية:\n\n${report.content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      throw new Error(`Deepseek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisContent = data.choices[0].message.content;
    
    let parsedAnalysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if JSON parsing fails
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
      console.error('Failed to parse Deepseek response as JSON:', parseError);
      parsedAnalysis = {
        executiveSummary: analysisContent.substring(0, 500),
        performanceMetrics: [],
        trendsAndPatterns: [],
        recommendations: [],
        riskAssessment: { overallRisk: 'medium', risks: [] },
        visualSuggestions: []
      };
    }

    // Update the report with processed analysis
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        content: JSON.stringify({
          original: report.content,
          analysis: parsedAnalysis,
          processedAt: new Date().toISOString(),
          processedBy: 'deepseek-r1'
        }),
        content_type: 'processed_analysis'
      })
      .eq('id', reportId);

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: parsedAnalysis,
        reportId: reportId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-whatsapp-reports function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});