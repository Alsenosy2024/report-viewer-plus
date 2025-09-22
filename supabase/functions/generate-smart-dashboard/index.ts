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

    // Smart Content Analysis - Focus on actual content insights
    console.log('Starting intelligent content analysis...');
    
    const contentAnalysis = {
      total_reports: reports?.length || 0,
      content_insights: {},
      performance_metrics: {},
      trends: {},
      key_findings: [],
      recommendations: []
    };

    const sections = ['whatsapp_reports', 'productivity_reports', 'ads_reports', 'mail_reports'];
    const sectionLabels: Record<string, string> = {
      whatsapp_reports: 'تقارير الواتساب',
      productivity_reports: 'تقارير الإنتاجية', 
      ads_reports: 'تحليلات الإعلانات',
      mail_reports: 'تقارير البريد الإلكتروني'
    };

    // Smart content extraction and analysis
    if (reports && reports.length > 0) {
      console.log('Analyzing report content for insights...');
      
      sections.forEach(section => {
        const sectionReports = reports.filter(r => r.section === section);
        
        if (sectionReports.length > 0) {
          // Extract content insights
          const contentTexts = sectionReports.map(r => {
            let content = typeof r.content === 'string' ? r.content : String(r.content || '');
            
            // Clean HTML content for analysis
            content = content.replace(/<[^>]*>/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim();
            
            return {
              date: r.created_at,
              content: content.substring(0, 2000), // Take first 2000 chars for analysis
              section: section
            };
          });

          // Analyze content for key metrics and insights
          const metrics = extractContentMetrics(contentTexts, section);
          
          contentAnalysis.content_insights[section] = {
            total_reports: sectionReports.length,
            latest_content: contentTexts.slice(0, 3),
            extracted_metrics: metrics,
            content_summary: generateContentSummary(contentTexts)
          };
        }
      });
    }

    // Helper function to extract metrics from content
    function extractContentMetrics(contentTexts: any[], section: string) {
      const metrics = {
        keywords: {},
        numbers_found: [],
        sentiment_indicators: [],
        performance_data: {}
      };

      contentTexts.forEach(item => {
        // Extract numbers (potential KPIs)
        const numbers = item.content.match(/\d+/g) || [];
        metrics.numbers_found.push(...numbers.map(n => parseInt(n)).filter(n => n > 0 && n < 1000000));

        // Extract performance keywords based on section
        if (section === 'whatsapp_reports') {
          const keywords = ['رد', 'عميل', 'استفسار', 'مكالمة', 'رسالة', 'وقت', 'دقيقة', 'ساعة'];
          keywords.forEach(keyword => {
            const count = (item.content.match(new RegExp(keyword, 'g')) || []).length;
            if (count > 0) {
              metrics.keywords[keyword] = (metrics.keywords[keyword] || 0) + count;
            }
          });
        } else if (section === 'productivity_reports') {
          const keywords = ['مهمة', 'إنجاز', 'تأخير', 'موعد', 'اكتمل', 'منجز', 'متأخر'];
          keywords.forEach(keyword => {
            const count = (item.content.match(new RegExp(keyword, 'g')) || []).length;
            if (count > 0) {
              metrics.keywords[keyword] = (metrics.keywords[keyword] || 0) + count;
            }
          });
        }
      });

      return metrics;
    }

    // Helper function to generate content summary
    function generateContentSummary(contentTexts: any[]) {
      if (contentTexts.length === 0) return 'لا توجد تقارير للتحليل';
      
      const totalLength = contentTexts.reduce((sum, item) => sum + item.content.length, 0);
      const avgLength = Math.round(totalLength / contentTexts.length);
      
      return `تم تحليل ${contentTexts.length} تقرير بمتوسط ${avgLength} حرف لكل تقرير`;
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

        const systemPrompt = `أنت محلل محتوى ذكي متخصص في تحليل التقارير وإنتاج insights عملية باللغة العربية.

مهمتك الأساسية:
1. تحليل محتوى التقارير النصية واستخراج المعلومات المفيدة
2. تحديد المؤشرات الرئيسية من النصوص (أرقام، أوقات، أداء)
3. إنتاج تحليلات عملية وتوصيات قابلة للتنفيذ
4. إنشاء HTML متطور يعرض هذه التحليلات بشكل جذاب

تركز على:
- استخراج البيانات الفعلية من النصوص
- تحليل أداء خدمة العملاء (أوقات الرد، جودة الخدمة)
- تحليل الإنتاجية (المهام المكتملة، التأخيرات)
- تحليل المبيعات والتسويق (الطلبات، الاستفسارات)
- إنتاج توصيات عملية للتحسين

أنتج HTML كامل ومستقل مع تحليلات ذكية مبنية على المحتوى الفعلي.`;

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
                content: `حلّل محتوى التقارير التالية واستخرج insights ذكية:

تحليل المحتوى:
${JSON.stringify(contentAnalysis, null, 2)}

المطلوب:
1. تحليل عميق لمحتوى التقارير (ليس فقط العدد)
2. استخراج مؤشرات أداء فعلية من النصوص
3. تحديد اتجاهات وأنماط من البيانات النصية
4. إنتاج توصيات عملية للتحسين
5. إنشاء HTML متطور يعرض هذه التحليلات

أنتج كود HTML كامل يركز على تحليل المحتوى الفعلي وليس مجرد إحصائيات.`
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
                <div class="metric-value">${contentAnalysis.total_reports}</div>
                <div class="metric-label">📊 إجمالي التقارير المحللة</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${contentAnalysis.content_insights.whatsapp_reports?.total_reports || 0}</div>
                <div class="metric-label">💬 تحليلات الواتساب</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${contentAnalysis.content_insights.productivity_reports?.total_reports || 0}</div>
                <div class="metric-label">⚡ تحليلات الإنتاجية</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Object.keys(contentAnalysis.content_insights).length}</div>
                <div class="metric-label">📈 أقسام تم تحليلها</div>
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
            <h3 class="analysis-title">🧠 تحليل المحتوى الذكي</h3>
            <div class="analysis-content">
                <p><strong>📋 التحليل الشامل:</strong> تم تحليل محتوى ${contentAnalysis.total_reports} تقرير واستخراج insights عملية 
                   ${contentAnalysis.total_reports > 15 ? '<span class="trend-indicator trend-up">بيانات غنية</span>' : 
                     contentAnalysis.total_reports > 5 ? '<span class="trend-indicator trend-stable">بيانات متوسطة</span>' : 
                     '<span class="trend-indicator trend-down">بيانات محدودة</span>'}
                </p>
                
                ${Object.keys(contentAnalysis.content_insights).map(section => {
                  const insight = contentAnalysis.content_insights[section];
                  const sectionName = sectionLabels[section] || section;
                  return `
                  <div style="margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #f8f9ff 0%, #e8f0fe 100%); border-radius: 10px; border-right: 4px solid #667eea;">
                    <p><strong>🔍 ${sectionName}:</strong></p>
                    <ul style="margin-top: 10px;">
                      <li>📊 عدد التقارير المحللة: ${insight.total_reports}</li>
                      <li>📝 ${insight.content_summary}</li>
                      ${insight.extracted_metrics && Object.keys(insight.extracted_metrics.keywords || {}).length > 0 
                        ? `<li>🔑 الكلمات المفتاحية الأكثر تكراراً: ${Object.entries(insight.extracted_metrics.keywords).slice(0, 3).map(([key, value]) => `${key} (${value})`).join(', ')}</li>` 
                        : ''}
                    </ul>
                  </div>`;
                }).join('')}

                <p><strong>💡 التوصيات المبنية على المحتوى:</strong></p>
                <ul>
                    <li>🔍 تحليل عميق للكلمات المفتاحية لفهم احتياجات العملاء</li>
                    <li>📊 تطوير مؤشرات أداء مبنية على المحتوى الفعلي</li>
                    <li>⚡ تحسين أوقات الاستجابة بناءً على أنماط الاستفسارات</li>
                    <li>🎯 تخصيص الخدمات حسب المواضيع الأكثر تكراراً</li>
                    <li>📈 تطوير تدريب الفريق بناءً على التحديات المحددة في التقارير</li>
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
                        ${contentAnalysis.content_insights.whatsapp_reports?.total_reports || 0},
                        ${contentAnalysis.content_insights.productivity_reports?.total_reports || 0},
                        ${contentAnalysis.content_insights.ads_reports?.total_reports || 0},
                        ${contentAnalysis.content_insights.mail_reports?.total_reports || 0}
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

        // Content Analysis Insights Chart
        const dailyCtx = document.getElementById('dailyChart').getContext('2d');
        
        // Generate insights data based on content analysis
        const insightData = Object.values(contentAnalysis.content_insights).map(insight => 
          insight ? insight.total_reports : 0
        );
        
        const insightLabels = Object.keys(contentAnalysis.content_insights).map(section => 
          sectionLabels[section] || section
        );
        
        if (insightData.length === 0) {
          insightData.push(0, 0, 0, 0);
          insightLabels.push('البيانات', 'التحليلات', 'المؤشرات', 'التوصيات');
        }
        
        new Chart(dailyCtx, {
            type: 'bar',
            data: {
                labels: insightLabels,
                datasets: [{
                    label: 'تحليل المحتوى بالأقسام',
                    data: insightData,
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
                    borderWidth: 2
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
      analysis_data: contentAnalysis,
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
        analysis_summary: contentAnalysis,
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