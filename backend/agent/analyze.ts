import { StreamOut } from "encore.dev/api";
import { ChatMessage } from "./chat";
import { processCompanySnapshot } from "../widgets/company-snapshot";
import { processNewsImpact } from "../widgets/news-impact";
import { processMacroSector } from "../widgets/macro-sector";
import { processRiskFlags } from "../widgets/risk-flags";
import { processCrypto } from "../widgets/crypto";
import { processFinancialAnalyst } from "../widgets/financial-analyst";
import { processDayTrader } from "../widgets/day-trader";
import { processMASpecialist } from "../widgets/ma-specialist";
import { processComparison } from "../widgets/comparison";
import { processPortfolio } from "../widgets/portfolio";
import { processMarketSentiment } from "../widgets/market-sentiment";
import { processAnalystConsensus } from "../widgets/analyst-consensus";
import { processInvestmentThesis } from "../widgets/investment-thesis";
import { processPeerComparison } from "../widgets/peer-comparison";
import { extractEntityInfo } from "./entity-extraction";

export async function analyzeQuery(
  query: string,
  stream: StreamOut<ChatMessage>
): Promise<void> {
  // Extract entity information (company name, ticker, etc.)
  const entityInfo = await extractEntityInfo(query);
  
  // Determine which widgets to activate based on the query
  const isCryptoQuery = /bitcoin|ethereum|crypto|btc|eth/i.test(query);
  
  // Start all widgets in parallel
  const widgetPromises: Promise<void>[] = [];

  // Comparison Widget (for "vs" or "compare" queries)
  if (entityInfo.isComparison && entityInfo.companies && entityInfo.companies.length >= 2) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Comparing companies...",
          widgetId: "comparison",
        });
        
        try {
          const data = await processComparison(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "Comparison ready",
            widgetId: "comparison",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Comparison failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "comparison",
          });
        }
      })()
    );
  }

  // Company Snapshot Widget
  if (entityInfo.ticker || entityInfo.companyName) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Fetching company snapshot...",
          widgetId: "company-snapshot",
        });
        
        try {
          const data = await processCompanySnapshot(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "Company snapshot ready",
            widgetId: "company-snapshot",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Company snapshot failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "company-snapshot",
          });
        }
      })()
    );
  }

  // News & Impact Widget
  if (entityInfo.companyName) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Analyzing news impact...",
          widgetId: "news-impact",
        });
        
        try {
          const data = await processNewsImpact(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "News analysis ready",
            widgetId: "news-impact",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `News analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "news-impact",
          });
        }
      })()
    );
  }

  // Macro & Sector Widget
  widgetPromises.push(
    (async () => {
      await stream.send({
        type: "widget_start",
        content: "Fetching macro indicators...",
        widgetId: "macro-sector",
      });
      
      try {
        const data = await processMacroSector(entityInfo);
        await stream.send({
          type: "widget_complete",
          content: "Macro analysis ready",
          widgetId: "macro-sector",
          data,
        });
      } catch (error) {
        await stream.send({
          type: "error",
          content: `Macro analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          widgetId: "macro-sector",
        });
      }
    })()
  );

  // Risk Flags Widget
  if (entityInfo.companyName) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Screening for risk flags...",
          widgetId: "risk-flags",
        });
        
        try {
          const data = await processRiskFlags(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "Risk screening complete",
            widgetId: "risk-flags",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Risk screening failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "risk-flags",
          });
        }
      })()
    );
  }

  // Crypto Widget
  if (isCryptoQuery) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Fetching crypto data...",
          widgetId: "crypto",
        });
        
        try {
          const data = await processCrypto(query);
          await stream.send({
            type: "widget_complete",
            content: "Crypto data ready",
            widgetId: "crypto",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Crypto data failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "crypto",
          });
        }
      })()
    );
  }

  // Financial Analyst Widget
  if (entityInfo.ticker) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Preparing financial analysis...",
          widgetId: "financial-analyst",
        });
        
        try {
          const data = await processFinancialAnalyst(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "Financial analysis ready",
            widgetId: "financial-analyst",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Financial analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "financial-analyst",
          });
        }
      })()
    );
  }

  // Day Trader Widget
  if (entityInfo.ticker && /day.*trad|intraday|scalp|short.*term/i.test(query)) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Analyzing intraday patterns...",
          widgetId: "day-trader",
        });
        
        try {
          const data = await processDayTrader(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "Day trading analysis ready",
            widgetId: "day-trader",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Day trading analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "day-trader",
          });
        }
      })()
    );
  }

  // M&A Specialist Widget
  if (entityInfo.ticker && /m&a|merger|acquisition|deal/i.test(query)) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Analyzing M&A landscape...",
          widgetId: "ma-specialist",
        });
        
        try {
          const data = await processMASpecialist(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "M&A analysis ready",
            widgetId: "ma-specialist",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `M&A analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "ma-specialist",
          });
        }
      })()
    );
  }

  // Portfolio Manager Widget
  if (entityInfo.companies && entityInfo.companies.length > 0 || entityInfo.ticker) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Analyzing portfolio...",
          widgetId: "portfolio",
        });
        
        try {
          const data = await processPortfolio(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "Portfolio analysis ready",
            widgetId: "portfolio",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Portfolio analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "portfolio",
          });
        }
      })()
    );
  }

  // Market Sentiment Widget
  if (entityInfo.companyName || /sentiment|mood|feeling|emotion/i.test(query)) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Analyzing market sentiment...",
          widgetId: "market-sentiment",
        });
        
        try {
          const data = await processMarketSentiment(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "Sentiment analysis ready",
            widgetId: "market-sentiment",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Sentiment analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "market-sentiment",
          });
        }
      })()
    );
  }

  // Analyst Consensus Widget
  if (entityInfo.ticker) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Gathering analyst consensus...",
          widgetId: "analyst-consensus",
        });
        
        try {
          const data = await processAnalystConsensus(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "Analyst consensus ready",
            widgetId: "analyst-consensus",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Analyst consensus failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "analyst-consensus",
          });
        }
      })()
    );
  }

  // Investment Thesis Widget
  if (entityInfo.ticker || entityInfo.companyName) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Generating investment thesis...",
          widgetId: "investment-thesis",
        });
        
        try {
          const data = await processInvestmentThesis(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "Investment thesis ready",
            widgetId: "investment-thesis",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Investment thesis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "investment-thesis",
          });
        }
      })()
    );
  }

  // Peer Comparison Widget
  if (entityInfo.ticker) {
    widgetPromises.push(
      (async () => {
        await stream.send({
          type: "widget_start",
          content: "Comparing to peers...",
          widgetId: "peer-comparison",
        });
        
        try {
          const data = await processPeerComparison(entityInfo);
          await stream.send({
            type: "widget_complete",
            content: "Peer comparison ready",
            widgetId: "peer-comparison",
            data,
          });
        } catch (error) {
          await stream.send({
            type: "error",
            content: `Peer comparison failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            widgetId: "peer-comparison",
          });
        }
      })()
    );
  }

  // Wait for all widgets to complete
  await Promise.all(widgetPromises);
}
