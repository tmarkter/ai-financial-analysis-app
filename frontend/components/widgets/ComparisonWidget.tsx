import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Scale, TrendingUp, BarChart3, AlertTriangle } from "lucide-react";
import { PromptEditor } from "../PromptEditor";
import { fmtMarketCap, fmtNumber, fmtPercent } from "@/utils/format";
import { EmptyState } from "../EmptyState";
import type { CompanyComparisonData } from "~backend/widgets/comparison";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Props {
  status: "loading" | "complete" | "error";
  data?: CompanyComparisonData;
  error?: string;
}

export function ComparisonWidget({ status, data, error }: Props) {

  const getChartData = () => {
    if (!data?.companies) return [];
    
    return data.companies.map(company => ({
      name: company.ticker,
      'Market Cap (B)': company.marketCap ? (company.marketCap / 1e9) : 0,
      'P/E Ratio': company.pe || 0,
      'ROE %': company.roe ? (company.roe * 100) : 0,
      'Debt/Equity': company.debtToEquity || 0,
    }));
  };

  const getRadarData = () => {
    if (!data?.companies) return [];
    
    const metrics = ['Valuation', 'Profitability', 'Growth', 'Risk', 'Size'];
    
    return metrics.map(metric => {
      const dataPoint: any = { metric };
      data.companies.forEach(company => {
        let value = 0;
        switch(metric) {
          case 'Valuation':
            value = company.pe ? Math.min(100, (1 / company.pe) * 500) : 0;
            break;
          case 'Profitability':
            value = company.roe ? company.roe * 100 : 0;
            break;
          case 'Growth':
            value = company.eps ? Math.min(100, company.eps * 5) : 0;
            break;
          case 'Risk':
            value = company.debtToEquity ? Math.max(0, 100 - company.debtToEquity * 10) : 50;
            break;
          case 'Size':
            value = company.marketCap ? Math.min(100, (company.marketCap / 1e12) * 20) : 0;
            break;
        }
        dataPoint[company.ticker] = value;
      });
      return dataPoint;
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Company Comparison</CardTitle>
              <CardDescription>Side-by-side analysis with color-coded metrics</CardDescription>
            </div>
          </div>
          <PromptEditor promptId="comparison" promptName="Comparison" />
        </div>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Comparison Failed</p>
                <p className="text-xs mt-1 opacity-90">{error}</p>
              </div>
            </div>
            {error?.includes(':') && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <p className="font-semibold mb-1">Possible causes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Invalid ticker symbols (check spelling)</li>
                  <li>API rate limits exceeded (retry in 60s)</li>
                  <li>Market data temporarily unavailable</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {status === "complete" && data && (
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{data.summary}</p>
            </div>

            {data.companies && Array.isArray(data.companies) && data.companies.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Key Metrics Comparison
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                        <YAxis stroke="hsl(var(--foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Market Cap (B)" fill="hsl(var(--primary))" />
                        <Bar dataKey="P/E Ratio" fill="hsl(var(--chart-2))" />
                        <Bar dataKey="ROE %" fill="hsl(var(--chart-3))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Performance Radar
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={getRadarData()}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" stroke="hsl(var(--foreground))" />
                        <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                        {data.companies.map((company, idx) => (
                          <Radar
                            key={idx}
                            name={company.ticker}
                            dataKey={company.ticker}
                            stroke={`hsl(var(--chart-${(idx % 5) + 1}))`}
                            fill={`hsl(var(--chart-${(idx % 5) + 1}))`}
                            fillOpacity={0.3}
                          />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Metric</th>
                        {data.companies.map((company, idx) => (
                          <th key={idx} className="text-left py-3 px-4 font-semibold">
                            {company.name}
                            <div className="text-xs font-normal text-muted-foreground">{company.ticker}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-muted-foreground">Price</td>
                        {data.companies.map((company, idx) => {
                          const isHighest = company.price === Math.max(...data.companies.map(c => c.price || 0));
                          return (
                            <td key={idx} className={`py-3 px-4 font-medium ${isHighest ? 'text-green-500' : ''}`}>
                              {fmtNumber(company.price)}
                            </td>
                          );
                        })}
                      </tr>
                      
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-muted-foreground">Market Cap</td>
                        {data.companies.map((company, idx) => {
                          const isHighest = company.marketCap === Math.max(...data.companies.map(c => c.marketCap || 0));
                          return (
                            <td key={idx} className={`py-3 px-4 font-medium ${isHighest ? 'text-green-500' : ''}`}>
                              {fmtMarketCap(company.marketCap)}
                            </td>
                          );
                        })}
                      </tr>

                      <tr className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-muted-foreground">P/E Ratio</td>
                        {data.companies.map((company, idx) => {
                          const isLowest = company.pe === Math.min(...data.companies.map(c => c.pe || Infinity).filter(p => p > 0));
                          return (
                            <td key={idx} className={`py-3 px-4 font-medium ${isLowest ? 'text-green-500' : ''}`}>
                              {fmtNumber(company.pe)}
                            </td>
                          );
                        })}
                      </tr>

                      <tr className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-muted-foreground">EPS</td>
                        {data.companies.map((company, idx) => {
                          const isHighest = company.eps === Math.max(...data.companies.map(c => c.eps || 0));
                          return (
                            <td key={idx} className={`py-3 px-4 font-medium ${isHighest ? 'text-green-500' : ''}`}>
                              {fmtNumber(company.eps)}
                            </td>
                          );
                        })}
                      </tr>

                      <tr className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-muted-foreground">ROE</td>
                        {data.companies.map((company, idx) => {
                          const isHighest = company.roe === Math.max(...data.companies.map(c => c.roe || 0));
                          return (
                            <td key={idx} className={`py-3 px-4 font-medium ${isHighest ? 'text-green-500' : ''}`}>
                              {fmtPercent(company.roe ? company.roe * 100 : company.roe)}
                            </td>
                          );
                        })}
                      </tr>

                      <tr className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-muted-foreground">Debt/Equity</td>
                        {data.companies.map((company, idx) => {
                          const isLowest = company.debtToEquity === Math.min(...data.companies.map(c => c.debtToEquity || Infinity).filter(d => d > 0));
                          return (
                            <td key={idx} className={`py-3 px-4 font-medium ${isLowest ? 'text-green-500' : ''}`}>
                              {fmtNumber(company.debtToEquity)}
                            </td>
                          );
                        })}
                      </tr>

                      <tr>
                        <td className="py-3 px-4 text-sm text-muted-foreground">Sector</td>
                        {data.companies.map((company, idx) => (
                          <td key={idx} className="py-3 px-4 text-sm">
                            {company.sector || 'N/A'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="py-8">
                <EmptyState 
                  title="No comparison data" 
                  subtitle="Unable to retrieve company data for comparison" 
                  icon="database" 
                />
              </div>
            )}

            {data.winner && Array.isArray(data.winner) && data.winner.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Category Winners
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.winner.map((w, idx) => (
                    <div key={idx} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-500">{w.category}</p>
                          <p className="text-sm font-bold mt-1">{w.company}</p>
                          <p className="text-xs text-muted-foreground mt-1">{w.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.sources && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Sources: {data.sources.map((s) => s.name).join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
