import { Injectable, Logger } from '@nestjs/common';

interface ClassificationResult {
  classification: 'APPLIED' | 'ASSESSMENT' | 'INTERVIEWING' | 'REJECTED' | 'OFFERED' | 'OTHER';
  confidence: number;
  companyName: string;
  role: string;
  extractedDetails?: any;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    if (this.apiKey) {
      this.logger.log('Gemini API Key detected. Utilizing Native Fetch REST connection...');
    } else {
      this.logger.warn('No GEMINI_API_KEY environment variable found. Falling back to Mock/Regex classifier.');
    }
  }

  async analyzeEmail(subject: string, body: string): Promise<ClassificationResult> {
    if (this.apiKey) {
      try {
        const prompt = `
          Analyze the following job application email (subject and body) to classify its status and extract metadata.
          
          Email Subject: "${subject}"
          Email Body:
          """
          ${body.substring(0, 1500)}
          """
          
          Return a JSON object with this exact structure:
          {
            "classification": "APPLIED" | "ASSESSMENT" | "INTERVIEWING" | "REJECTED" | "OFFERED" | "OTHER",
            "confidence": 0.0 to 1.0 (float),
            "companyName": "Extracted Company Name",
            "role": "Extracted Position/Role (e.g. Software Engineer)",
            "details": {
              "round": "e.g. Technical Round 1, HackerRank test" (optional),
              "meetingLink": "URL if present" (optional),
              "ctc": "salary details if present" (optional),
              "location": "office location if present" (optional)
            }
          }
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
        
        // Execute native node 18 fetch
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            }
          }),
        });

        if (response.ok) {
          const data = await response.json() as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            this.logger.log(`Gemini response: ${text}`);
            const parsed = JSON.parse(text);
            return {
              classification: parsed.classification || 'OTHER',
              confidence: parsed.confidence || 0.9,
              companyName: parsed.companyName || 'Unknown',
              role: parsed.role || 'Unknown',
              extractedDetails: parsed.details || {},
            };
          }
        } else {
          this.logger.error(`Gemini API error: HTTP ${response.status} - ${response.statusText}`);
        }
      } catch (err) {
        this.logger.error('Error running Gemini AI Classification, using fallback parser', err);
      }
    }

    return this.fallbackRegexParser(subject, body);
  }

  private fallbackRegexParser(subject: string, body: string): ClassificationResult {
    const combined = `${subject} ${body}`.toLowerCase();
    
    let classification: ClassificationResult['classification'] = 'OTHER';
    let confidence = 0.7;

    // Direct match queries
    if (combined.includes('rejection') || combined.includes('not moving forward') || combined.includes('unfortunately') || combined.includes('thank you for your interest but')) {
      classification = 'REJECTED';
      confidence = 0.85;
    } else if (combined.includes('interview') || combined.includes('schedule') || combined.includes('google meet') || combined.includes('zoom.us') || combined.includes('calendar')) {
      classification = 'INTERVIEWING';
      confidence = 0.8;
    } else if (combined.includes('assessment') || combined.includes('hackerrank') || combined.includes('test') || combined.includes('codility') || combined.includes('coderpad')) {
      classification = 'ASSESSMENT';
      confidence = 0.85;
    } else if (combined.includes('offer') || combined.includes('compensation') || combined.includes('contract') || combined.includes('welcome to the team')) {
      classification = 'OFFERED';
      confidence = 0.9;
    } else if (combined.includes('application received') || combined.includes('thank you for applying') || combined.includes('applied')) {
      classification = 'APPLIED';
      confidence = 0.85;
    }

    // Try to guess company name
    let companyName = 'Unknown';
    const companyMatches = combined.match(/(?:at|with|from) ([a-z0-9\s]+) (?:team|careers|jobs)/);
    if (companyMatches && companyMatches[1]) {
      companyName = companyMatches[1].trim().replace(/^\w/, (c) => c.toUpperCase());
    } else {
      // Split headers/subjects to look for common names
      const words = subject.split(/[\s,]+/);
      if (words.length > 1) {
        companyName = words[1];
      }
    }

    // Try to guess role name
    let role = 'Software Developer';
    if (combined.includes('frontend')) role = 'Frontend Engineer';
    else if (combined.includes('backend')) role = 'Backend Engineer';
    else if (combined.includes('designer')) role = 'Product Designer';
    else if (combined.includes('fullstack')) role = 'Fullstack Developer';

    return {
      classification,
      confidence,
      companyName,
      role,
      extractedDetails: {},
    };
  }

  async generateInsights(userApplications: any[]): Promise<{ title: string; description: string }[]> {
    if (this.apiKey) {
      try {
        const prompt = `
          Based on the user's active job application timeline and status logs:
          ${JSON.stringify(userApplications.map(a => ({ company: a.companyName, status: a.status, appliedDate: a.appliedDate })))}
          
          Generate 3 actionable, professional job search insights, tips, or follow-up notifications.
          Return a JSON array exactly in this format:
          [
            { "title": "Insight 1 title", "description": "Insight 1 details" },
            { "title": "Insight 2 title", "description": "Insight 2 details" },
            { "title": "Insight 3 title", "description": "Insight 3 details" }
          ]
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            }
          }),
        });

        if (response.ok) {
          const data = await response.json() as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return JSON.parse(text);
          }
        }
      } catch (err) {
        this.logger.error('Failed generating AI insights, falling back to static insights', err);
      }
    }

    return [
      {
        title: 'Review Status Pipeline',
        description: 'You have a healthy list of applications. Follow up on active applications with no reply for more than 10 days.',
      },
      {
        title: 'Mock Interviews Recommended',
        description: 'You have interviews coming up! Consider scheduling peer mock tests or reviewing key algorithmic problem sets.',
      },
    ];
  }
}
