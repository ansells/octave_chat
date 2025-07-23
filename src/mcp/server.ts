// Create a server that listens on port 3001 and starts the MCP server

import { OctaveMCP } from './octaveMCP';

const octaveMCP = new OctaveMCP();
octaveMCP.start().catch((error) => {
  console.error('MCP server error', error);
  process.exit(1);
});
