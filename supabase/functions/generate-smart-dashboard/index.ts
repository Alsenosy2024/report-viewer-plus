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
      console.warn('OPENAI_API_KEY not found, using fallback HTML');
    }

    let generatedHTML = '';
    
    // Try GPT-5 with timeout, fallback if fails
    if (openAIApiKey) {
      console.log('Attempting GPT-5 call with timeout...');
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('GPT-5 call timeout, aborting...');
          controller.abort();
        }, 25000); // 25 second timeout

        const systemPrompt = `أنت محلل بيانات ذكي متخصص في إنتاج لوحات معلومات تفاعلية متطورة باللغة العربية.

المطلوب منك إنتاج كود HTML كامل متطور يحتوي على:
- رسوم بيانية تفاعلية (Chart.js)
- خرائط حرارية للأيام السبعة
- مؤشرات أداء رئيسية (KPIs)
- تحليلات مكتوبة ذكية
- تصميم responsive حديث
- ألوان وتدرجات جذابة

يجب أن يكون الكود HTML مكتمل ومستقل، يعمل بشكل مستقل دون اعتماد على ملفات خارجية.
قم بإنتاج HTML واحد فقط كامل ومتطور.`;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'gpt-5-2025-08-07',
            messages: [
              { role: 'system', content: systemPrompt },
              { 
                role: 'user', 
                content: `حلّل البيانات التالية وأنتج لوحة معلومات HTML متطورة:

البيانات المتاحة:
${JSON.stringify(reportsAnalysis, null, 2)}

أنتج كود HTML كامل ومتطور للداشبورد الذكي.`
              }
            ],
            max_completion_tokens: 4000
          }),
        });
        
        clearTimeout(timeoutId);

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const gptContent = aiData.choices?.[0]?.message?.content || '';
          
          if (gptContent.trim().length > 100) { // Valid content check
            generatedHTML = gptContent;
            console.log('GPT-5 HTML generated successfully');
          } else {
            throw new Error('GPT-5 returned insufficient content');
          }
        } else {
          const errorText = await aiResponse.text();
          console.error('GPT-5 API error:', aiResponse.status, errorText);
          throw new Error(`GPT-5 API failed: ${aiResponse.status}`);
        }
        
      } catch (error) {
        console.error('GPT-5 call failed:', error.message);
        // Fall through to fallback HTML
      }
    }
    
    // Enhanced fallback HTML if GPT-5 fails or unavailable
    if (!generatedHTML.trim()) {
      console.log('Using enhanced fallback HTML...');
      
      generatedHTML = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الداشبورد الذكي - تحليل آخر 7 أيام</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh; 
            color: #333; 
            animation: fadeIn 1s ease-in;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea, #764ba2); 
            color: white; 
            padding: 40px; 
            border-radius: 20px; 
            margin-bottom: 30px; 
            text-align: center; 
            box-shadow: 0 15px 40px rgba(0,0,0,0.15); 
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 25px; 
            margin-bottom: 40px; 
        }
        .metric-card { 
            background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%); 
            padding: 30px; 
            border-radius: 20px; 
            box-shadow: 0 8px 25px rgba(0,0,0,0.1); 
            transition: all 0.3s ease; 
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        .metric-card:hover { 
            transform: translateY(-8px) scale(1.02); 
            box-shadow: 0 15px 35px rgba(0,0,0,0.15); 
        }
        .metric-value { 
            font-size: 3em; 
            font-weight: bold; 
            background: linear-gradient(135deg, #667eea, #764ba2); 
            -webkit-background-clip: text; 
            background-clip: text; 
            -webkit-text-fill-color: transparent; 
            margin-bottom: 8px; 
        }
        .metric-label { color: #555; font-size: 1.2em; font-weight: 500; }
        .charts-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); 
            gap: 30px; 
            margin-bottom: 40px; 
        }
        .chart-card { 
            background: white; 
            padding: 30px; 
            border-radius: 20px; 
            box-shadow: 0 8px 25px rgba(0,0,0,0.1); 
            transition: transform 0.3s ease;
        }
        .chart-card:hover { transform: translateY(-5px); }
        .chart-title { 
            font-size: 1.4em; 
            color: #333; 
            margin-bottom: 25px; 
            text-align: center; 
            font-weight: 600;
        }
        .section-analysis { 
            background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%); 
            padding: 35px; 
            border-radius: 20px; 
            box-shadow: 0 8px 25px rgba(0,0,0,0.1); 
            margin-bottom: 30px; 
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        .analysis-title { 
            background: linear-gradient(135deg, #667eea, #764ba2); 
            -webkit-background-clip: text; 
            background-clip: text; 
            -webkit-text-fill-color: transparent; 
            font-size: 1.8em; 
            margin-bottom: 20px; 
            font-weight: 600;
        }
        .analysis-content { line-height: 1.8; font-size: 1.1em; }
        .analysis-content p { margin-bottom: 15px; }
        .analysis-content ul { margin: 15px 0 0 25px; }
        .analysis-content li { margin-bottom: 8px; }
        .footer { 
            text-align: center; 
            padding: 25px; 
            color: white; 
            opacity: 0.9; 
            font-size: 1.1em;
        }
        canvas { max-height: 350px; }
        .trend-indicator { 
            display: inline-block; 
            padding: 5px 12px; 
            border-radius: 20px; 
            font-size: 0.9em; 
            font-weight: 600; 
            margin-left: 10px;
        }
        .trend-up { background: #e8f5e8; color: #2e7d32; }
        .trend-down { background: #ffebee; color: #c62828; }
        .trend-stable { background: #e3f2fd; color: #1565c0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 الداشبورد الذكي المتطور</h1>
            <p>تحليل شامل ومتقدم لبيانات آخر 7 أيام</p>
            <p>تم إنتاجه تلقائياً في ${new Date().toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${reportsAnalysis.total}</div>
                <div class="metric-label">📊 إجمالي التقارير</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportsAnalysis.by_section.whatsapp_reports?.count || 0}</div>
                <div class="metric-label">💬 تقارير الواتساب</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportsAnalysis.by_section.productivity_reports?.count || 0}</div>
                <div class="metric-label">⚡ تقارير الإنتاجية</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportsAnalysis.by_section.ads_reports?.count || 0}</div>
                <div class="metric-label">📢 تقارير الإعلانات</div>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-card">
                <h3 class="chart-title">📈 توزيع التقارير حسب القسم</h3>
                <canvas id="sectionChart"></canvas>
            </div>
            <div class="chart-card">
                <h3 class="chart-title">📅 التقارير اليومية (آخر 7 أيام)</h3>
                <canvas id="dailyChart"></canvas>
            </div>
        </div>

        <div class="section-analysis">
            <h3 class="analysis-title">📊 تحليل الأداء المتقدم</h3>
            <div class="analysis-content">
                <p><strong>📋 إجمالي التقارير:</strong> تم تحليل ${reportsAnalysis.total} تقرير خلال الأسبوع الماضي 
                   ${reportsAnalysis.total > 10 ? '<span class="trend-indicator trend-up">نشاط عالي</span>' : 
                     reportsAnalysis.total > 5 ? '<span class="trend-indicator trend-stable">نشاط متوسط</span>' : 
                     '<span class="trend-indicator trend-down">نشاط منخفض</span>'}
                </p>
                <p><strong>🏆 أكثر الأقسام نشاطاً:</strong> ${Object.entries(reportsAnalysis.by_section).length > 0 
                  ? Object.entries(reportsAnalysis.by_section).reduce((a, b) => 
                      (reportsAnalysis.by_section[a[0]]?.count || 0) > (reportsAnalysis.by_section[b[0]]?.count || 0) ? a : b)[0] 
                  : 'غير محدد'}
                </p>
                <p><strong>💡 التوصيات الذكية:</strong></p>
                <ul>
                    <li>🔄 متابعة تحسين أداء الأقسام النشطة للحفاظ على الزخم</li>
                    <li>📈 تطوير استراتيجيات لزيادة التفاعل في الأقسام ذات النشاط المنخفض</li>
                    <li>⚡ إجراء مراجعة دورية لضمان جودة البيانات ودقة التقارير</li>
                    <li>🎯 تحديد الأنماط الزمنية لتحسين توزيع الموارد</li>
                </ul>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>🚀 تم إنتاج هذا التقرير تلقائياً باستخدام تقنيات الذكاء الاصطناعي المتقدمة</p>
        <p>آخر تحديث: ${new Date().toLocaleTimeString('ar-EG')}</p>
    </div>

    <script>
        // Section Distribution Chart with enhanced styling
        const sectionCtx = document.getElementById('sectionChart').getContext('2d');
        new Chart(sectionCtx, {
            type: 'doughnut',
            data: {
                labels: ['الواتساب', 'الإنتاجية', 'الإعلانات', 'البريد الإلكتروني'],
                datasets: [{
                    data: [
                        ${reportsAnalysis.by_section.whatsapp_reports?.count || 0},
                        ${reportsAnalysis.by_section.productivity_reports?.count || 0},
                        ${reportsAnalysis.by_section.ads_reports?.count || 0},
                        ${reportsAnalysis.by_section.mail_reports?.count || 0}
                    ],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(243, 156, 18, 0.8)',
                        'rgba(231, 76, 60, 0.8)'
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(243, 156, 18, 1)',
                        'rgba(231, 76, 60, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 2000
                }
            }
        });

        // Daily Reports Chart with enhanced styling
        const dailyCtx = document.getElementById('dailyChart').getContext('2d');
        const dailyData = [
            ${Object.entries(reportsAnalysis.by_day || {}).sort().map(([date, data]) => data.count || 0).join(', ') || '0,0,0,0,0,0,0'}
        ];
        const dailyLabels = [
            ${Object.keys(reportsAnalysis.by_day || {}).sort().map(date => 
              `'${new Date(date).toLocaleDateString('ar-EG', {weekday: 'short', month: 'short', day: 'numeric'})}'`
            ).join(', ') || "'الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'"}
        ];
        
        new Chart(dailyCtx, {
            type: 'line',
            data: {
                labels: dailyLabels,
                datasets: [{
                    label: 'عدد التقارير',
                    data: dailyData,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        ticks: { font: { size: 11 } }
                    },
                    x: { 
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        ticks: { font: { size: 11 } }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        // Add loading animation completion
        setTimeout(() => {
            document.body.style.animation = 'none';
        }, 1000);
    </script>
</body>
</html>`;
    }

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
      .maybeSingle();

    if (existingDashboard) {
      await supabase
        .from('smart_dashboards')
        .update(dashboardData)
        .eq('id', existingDashboard.id);
      console.log('Updated existing dashboard');
    } else {
      await supabase
        .from('smart_dashboards')
        .insert({
          ...dashboardData,
          date_generated: today
        });
      console.log('Created new dashboard');
    }

    console.log('Smart dashboard completed successfully');

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
    
    // Minimal fallback HTML in case of total failure
    const fallbackHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>الداشبورد الذكي</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; }
            .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 15px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #e74c3c; margin-bottom: 20px; }
            .title { font-size: 2.5em; margin-bottom: 20px; color: #2c3e50; }
            .message { font-size: 1.2em; line-height: 1.6; color: #555; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="title">🔧 الداشبورد الذكي</h1>
            <div class="error">
                <p>⚠️ حدث خطأ مؤقت في تحليل البيانات</p>
            </div>
            <div class="message">
                <p>نعمل على حل المشكلة وتحسين نظام التحليل الذكي.</p>
                <p>يرجى المحاولة مرة أخرى بعد قليل أو الاتصال بالدعم الفني.</p>
                <p><strong>رمز الخطأ:</strong> ${error.message}</p>
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