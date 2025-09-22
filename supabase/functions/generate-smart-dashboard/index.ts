import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting smart dashboard generation...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get reports from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      throw new Error('Failed to fetch reports');
    }

    console.log(`Found ${reports?.length || 0} reports from last 7 days`);

    // Prepare detailed data analysis
    const reportsAnalysis = {
      total: reports?.length || 0,
      by_section: {},
      by_day: {},
      by_content_type: {},
      trends: {},
      performance_indicators: {}
    };

    const sections = ['whatsapp_reports', 'productivity_reports', 'ads_reports', 'mail_reports'];
    const sectionLabels: Record<string, string> = {
      whatsapp_reports: 'تقارير الواتساب',
      productivity_reports: 'تقارير الإنتاجية',
      ads_reports: 'تحليلات الإعلانات',
      mail_reports: 'تقارير البريد الإلكتروني'
    };

    // Analyze data
    if (reports && reports.length > 0) {
      // By section analysis
      sections.forEach(section => {
        const sectionReports = reports.filter(r => r.section === section);
        reportsAnalysis.by_section[section] = {
          count: sectionReports.length,
          processed: sectionReports.filter(r => r.content_type === 'processed_analysis').length,
          recent: sectionReports.slice(0, 3).map(r => ({
            date: r.created_at,
            content_preview: (typeof r.content === 'string' ? r.content : String(r.content)).substring(0, 200)
          }))
        };
      });

      // Daily analysis
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayReports = reports.filter(r => r.created_at.startsWith(dateStr));
        
        reportsAnalysis.by_day[dateStr] = {
          count: dayReports.length,
          sections: sections.reduce((acc, section) => {
            acc[section] = dayReports.filter(r => r.section === section).length;
            return acc;
          }, {} as Record<string, number>)
        };
      }
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Calling GPT-5 with thinking pattern for dashboard analysis...');
    
    const systemPrompt = `أنت محلل بيانات ذكي متخصص في إنتاج لوحات معلومات تفاعلية متطورة باللغة العربية.

سيتم تزويدك ببيانات تقارير آخر 7 أيام من 4 أقسام:
1. تقارير الواتساب - بيانات المحادثات والرسائل
2. تقارير الإنتاجية - الأداء والمهام والالتزامات  
3. تحليلات الإعلانات - الإنفاق والنتائج والعائد
4. تقارير البريد الإلكتروني - معدلات الفتح والنقر

المطلوب منك:
1. تحليل البيانات بعمق وفهم الأنماط والاتجاهات
2. إنتاج كود HTML كامل متطور يحتوي على:
   - رسوم بيانية تفاعلية (Chart.js)
   - خرائط حرارية للأيام السبعة
   - مؤشرات أداء رئيسية (KPIs)
   - تحليلات مكتوبة ذكية
   - تصميم responsive حديث
   - ألوان وتدرجات جذابة
   - أنيميشن CSS للعناصر

يجب أن يكون الكود HTML مكتمل ومستقل، يعمل بشكل مستقل دون اعتماد على ملفات خارجية.

قم بإنتاج HTML واحد فقط كامل ومتطور.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `حلّل البيانات التالية وأنتج لوحة معلومات HTML متطورة:

البيانات المتاحة:
${JSON.stringify(reportsAnalysis, null, 2)}

التقارير الأخيرة (عينة):
${JSON.stringify(reports?.slice(0, 10).map(r => ({
  section: r.section,
  date: r.created_at,
  type: r.content_type,
  preview: (typeof r.content === 'string' ? r.content : String(r.content)).substring(0, 150)
})), null, 2)}

أنتج كود HTML كامل ومتطور للداشبورد الذكي.`
          }
        ],
        max_completion_tokens: 4000,
        temperature: undefined // GPT-5 doesn't support temperature
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('GPT-5 API error:', errorText);
      throw new Error(`GPT-5 API failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const generatedHTML = aiData.choices?.[0]?.message?.content || '';
    
    console.log('Smart dashboard HTML generated successfully');

    // Store the analysis with generated timestamp
    const dashboardData = {
      html_content: generatedHTML,
      analysis_data: reportsAnalysis,
      generated_at: new Date().toISOString(),
      reports_analyzed: reports?.length || 0,
      last_update: new Date().toISOString()
    };

    // Check if today's analysis exists
    const today = new Date().toISOString().split('T')[0];
    const { data: existingDashboard } = await supabase
      .from('smart_dashboards')
      .select('id')
      .eq('date_generated', today)
      .single();

    if (existingDashboard) {
      await supabase
        .from('smart_dashboards')
        .update(dashboardData)
        .eq('id', existingDashboard.id);
    } else {
      await supabase
        .from('smart_dashboards')
        .insert({
          ...dashboardData,
          date_generated: today
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        html_content: generatedHTML,
        analysis_summary: reportsAnalysis,
        generated_at: dashboardData.generated_at,
        reports_count: reports?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-smart-dashboard function:', error);
    
    // Fallback HTML in case of error
    const fallbackHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>الداشبورد الذكي</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; }
            .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .error { text-align: center; color: #e74c3c; }
            .title { font-size: 2.5em; text-align: center; margin-bottom: 30px; color: #2c3e50; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="title">🔧 الداشبورد الذكي قيد التطوير</h1>
            <div class="error">
                <p>حدث خطأ مؤقت في تحليل البيانات. يرجى المحاولة لاحقاً.</p>
                <p>نعمل على تحسين نظام التحليل الذكي لتوفير تجربة أفضل.</p>
            </div>
        </div>
    </body>
    </html>`;

    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to generate smart dashboard', 
        details: error.message,
        html_content: fallbackHTML
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});