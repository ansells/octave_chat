import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { OctiveAPI } from '../octave/octaveAPI';
import express, { Request, Response } from 'express';

export class OctaveMCP {
  private octiveAPI: OctiveAPI;
  private app: express.Application;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.octiveAPI = new OctiveAPI(true);
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.post('/mcp', async (req: Request, res: Response) => {
      try {
        const server = this.getServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });
        res.on('close', () => {
          console.log('Request closed');
          transport.close();
          server.close();
        });
        await server.connect(transport);
        transport.handleRequest(req, res, req.body);
        res.send('MCP server started');
      } catch (error) {
        console.error('Error handling MCP request', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // SSE notifications not supported in stateless mode
    this.app.get('/mcp', async (req: Request, res: Response) => {
      console.log('Received GET MCP request');
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed.',
          },
          id: null,
        })
      );
    });

    // Session termination not needed in stateless mode
    this.app.delete('/mcp', async (req: Request, res: Response) => {
      console.log('Received DELETE MCP request');
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed.',
          },
          id: null,
        })
      );
    });
  }

  private getServer(): McpServer {
    const server = new McpServer({
      name: 'octave-mcp',
      title: 'Octave MCP',
      version: '1.0.0',
    });

    server.registerTool(
      'enrichCompany',
      {
        description:
          'Enrich company information using the company domain. Provides detailed company data including size, industry, revenue, and other business intelligence.',
        inputSchema: {
          companyDomain: z
            .string()
            .describe(
              'The company domain (e.g., example.com) to enrich information for'
            ),
        },
      },
      async ({ companyDomain }) => {
        try {
          const result = await this.octiveAPI.enrichCompany({
            companyDomain,
          });
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        } catch (error) {
          console.error('[Error]', error);
          return {
            content: [{ type: 'text', text: 'Error enriching company' }],
          };
        }
      }
    );

    server.registerTool(
      'enrichPerson',
      {
        description:
          'Enrich person information using their LinkedIn profile URL. Provides detailed information about the person including their role, experience, and company.',
        inputSchema: {
          linkedInProfile: z
            .string()
            .describe(
              'The LinkedIn profile URL of the person to enrich information for'
            ),
        },
      },
      async ({ linkedInProfile }) => {
        try {
          const result = await this.octiveAPI.enrichPerson({
            linkedInProfile,
          });
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        } catch (error) {
          console.error('[Error]', error);
          return {
            content: [{ type: 'text', text: 'Error enriching person' }],
          };
        }
      }
    );

    server.registerTool(
      'generateEmails',
      {
        description:
          'Generate email sequences for a person using their LinkedIn profile URL. Provides a list of email sequences that can be used to engage with the person.',
        inputSchema: {
          linkedInProfile: z
            .string()
            .describe(
              'The LinkedIn profile URL of the person to generate emails for'
            ),
        },
      },
      async ({ linkedInProfile }) => {
        try {
          const result = await this.octiveAPI.generateEmails({
            linkedInProfile,
          });
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          };
        } catch (error) {
          console.error('[Error]', error);
          return {
            content: [{ type: 'text', text: 'Error generating emails' }],
          };
        }
      }
    );

    return server;
  }

  async start() {
    this.app.listen(this.port, (error?: Error | null) => {
      if (error) {
        console.error('Error starting MCP server', error);
        process.exit(1);
      }
      console.log(`MCP server listening on port ${this.port}`);
    });
  }
}
