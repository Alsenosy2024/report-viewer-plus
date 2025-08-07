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
            content: `You are an expert data analyst specializing in WhatsApp business communications. Your task is to analyze WhatsApp reports and create beautifully structured, actionable insights.

For each report, provide:
1. **Executive Summary** - Key highlights in 2-3 sentences
2. **Performance Metrics** - Extract and highlight important numbers
3. **Trends & Patterns** - Identify significant trends
4. **Actionable Recommendations** - 3-5 specific recommendations
5. **Risk Assessment** - Any potential issues or concerns
6. **Visual Data Suggestions** - Suggest chart types for key metrics

Format your response as structured JSON with the following schema:
{
  "executiveSummary": "string",
  "performanceMetrics": [
    {
      "metric": "string",
      "value": "string",
      "trend": "positive|negative|neutral",
      "description": "string"
    }
  ],
  "trendsAndPatterns": [
    {
      "title": "string",
      "description": "string",
      "impact": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "string",
      "expectedImpact": "string",
      "timeframe": "string"
    }
  ],
  "riskAssessment": {
    "overallRisk": "high|medium|low",
    "risks": [
      {
        "risk": "string",
        "severity": "high|medium|low",
        "mitigation": "string"
      }
    ]
  },
  "visualSuggestions": [
    {
      "chartType": "string",
      "dataPoints": "string",
      "purpose": "string"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Please analyze this WhatsApp report and provide structured insights:\n\n${report.content}`
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