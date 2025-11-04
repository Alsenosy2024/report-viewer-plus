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

    // Process with OpenAI GPT-5
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'أنت محلل بيانات خبير متخصص في اتصالات واتساب التجارية. مهمتك هي تحليل تقارير واتساب وإنشاء رؤى جميلة ومنظمة وقابلة للتنفيذ. **مهم جداً: يجب أن تكون جميع الردود والتحليلات باللغة العربية فقط.**'
          },
          {
            role: 'user',
            content: `لكل تقرير، قدم التحليل باللغة العربية مع: \n1. الملخص التنفيذي \n2. مقاييس الأداء \n3. الاتجاهات والأنماط \n4. التوصيات القابلة للتنفيذ \n5. تقييم المخاطر \n6. اقتراحات البيانات المرئية \n\nقم بتنسيق إجابتك كـ JSON منظم وفق المخطط التالي (بالعربية):\n{\n  "executiveSummary": "ملخص تنفيذي مفصل باللغة العربية",\n  "performanceMetrics": [{"metric":"اسم المقياس","value":"قيمة","trend":"positive|negative|neutral","description":"وصف"}],\n  "trendsAndPatterns": [{"title":"عنوان","description":"وصف","impact":"high|medium|low"}],\n  "recommendations": [{"priority":"high|medium|low","action":"إجراء","expectedImpact":"تأثير","timeframe":"إطار زمني"}],\n  "riskAssessment": {"level":"high|medium|low","factors":["عامل"],"mitigation":"خطة"},\n  "visualSuggestions": [{"chartType":"نوع الرسم","dataPoints":"نقاط البيانات","purpose":"الغرض"}]\n}\n\nيرجى تحليل تقرير واتساب هذا وتقديم رؤى منظمة باللغة العربية:\n\n${report.content}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
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

    // Update the report with processed analysis
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