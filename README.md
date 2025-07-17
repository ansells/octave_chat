# Octave Chat

A modern NextJS application built with TypeScript for AI-powered chat interactions. The application features a clean, responsive interface with real-time chat capabilities and integrates with OpenAI to provide intelligent responses using specialized tools for customer research.

## Features

- **Modern UI**: Clean, responsive design with dark mode support
- **Real-time Chat**: Interactive chat interface with loading states
- **OpenAI Integration**: Powered by GPT-4 with function calling capabilities
- **Specialized Tools**: Three custom tools for customer research:
  - Company enrichment via domain lookup
  - Person enrichment via LinkedIn profile URLs
  - Email generation for outreach
- **TypeScript**: Full TypeScript support for type safety
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Component-based**: Well-organized React components

## AI Tools

The application includes three specialized AI tools for customer research:

### 1. Company Enrichment (`enrichCompany`)

- **Input**: Company domain (e.g., `example.com`)
- **Purpose**: Provides detailed company information including size, industry, revenue, and business intelligence
- **Usage**: Ask the AI about any company by providing their website domain

### 2. Person Enrichment (`enrichPerson`)

- **Input**: LinkedIn profile URL
- **Purpose**: Provides detailed information about a person including their role, experience, and company
- **Usage**: Ask the AI about a specific person by providing their LinkedIn profile URL

### 3. Email Generation (`generateEmails`)

- **Input**: LinkedIn profile URL
- **Purpose**: Creates personalized emails for outreach based on the person's profile
- **Usage**: Ask the AI to generate emails for a specific person by providing their LinkedIn profile URL

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint with OpenAI integration
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page
│   └── globals.css               # Global styles
├── components/
│   ├── ChatInstructions.tsx      # Instructions component
│   ├── ChatInput.tsx             # Chat input component
│   ├── ChatOutput.tsx            # Chat output component
│   └── ChatInterface.tsx         # Main chat interface
├── types/
│   └── chat.ts                   # TypeScript type definitions
└── utils/
    └── tools.ts                  # AI tool functions and definitions
```

## Components

### ChatInterface

The main component that orchestrates the chat functionality and manages state.

### ChatInstructions

Displays helpful instructions for using the chat interface with information about available AI tools.

### ChatInput

Handles user input with features like:

- Multi-line text input
- Enter key submission (Shift+Enter for new line)
- Send button with loading state
- Input validation

### ChatOutput

Displays chat messages with features like:

- Auto-scrolling to latest message
- User/bot message differentiation
- Timestamp display
- Loading animation for processing messages
- Tool call information display

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:

   Create a `.env.local` file in the root directory and add your OpenAI API key:

   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   OCTAVE_API_KEY=your_octave_api_key_here
   OCTAVE_ENRICH_COMPANY_OID=your_enrich_company_agent_oid
   OCTAVE_ENRICH_PERSON_OID=your_enrich_person_agent_oid
   OCTAVE_SEQUENCE_OID=your_sequence_agent_oid
   ```

3. **Start development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage Examples

Once the application is running, you can interact with the AI using natural language:

- **Company Research**: "Tell me about Google" or "What can you find about microsoft.com?"
- **Person Research**: "Give me information about [LinkedIn Profile URL]"
- **Email Generation**: "Generate an email for [LinkedIn Profile URL]" or "Create outreach emails for this person: [LinkedIn Profile URL]"

## API Integration

The application integrates with:

- **OpenAI GPT-4**: For intelligent conversation and function calling
- **Custom Tools**: Three specialized functions for customer research using the Octave API

### Tool Implementation

The three AI tools are currently implemented as placeholder functions in `src/utils/tools.ts`. These will be replaced with actual Octave agent integrations to provide real customer research capabilities.

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **OpenAI SDK**: AI integration with function calling
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons
- **React 19**: UI library

## Security Considerations

- OpenAI API key is stored securely in environment variables
- Input validation on all chat endpoints
- Error handling for API failures
- No sensitive data logging

## Future Enhancements

- Advanced message formatting
- Change tool-calling to an MCP client/server
- Unit testing
- User authentication and session management
- Chat history persistence
- Message export functionality
- Rate limiting and usage analytics

## Development

The application is set up with:

- ESLint for code linting
- TypeScript for type checking
- Tailwind CSS for styling
- Hot reloading for development

### Timeline

#### 1 Hour:

- Refamiliarize myelf with NextJS stup
- Some initial research on Octive features and API
- Craft the instructions for Cursor to make the initial NextJS project

  - Prompt used:

  ```
  I want to setup a new NextJS application in the current directory called Octave Chat. Here are a few initial parameters for the app:
  - It should use Typescript
  - The main UI will be very simple consisting of one main page with a text box for inputting chat text and an output area for showing the response data
  - There will be some instructions above the input text box and the output data may enable some user interaction (details later)
  - Please create well-designed client components for these parts of the screen
  - The chat data will need to be processed by a server component that will integrate OpenAI and another API. Details of this will be provided later
  ```

- Review generated code and update instructions

#### 1 Hour

- OpenAI Integration Implementation
  - Prompt used:

```
Now I want to integrate openAI into the chat so that the user's chat will be processed by the LLM. I am also going to create 3 different functions to be used as tools by the LLM. We will fill in the details of the functions later, but the initial definitions will be:
- enrichCompany(companyDomain: string)
- enrichPerson(linkedInProfile: string)
- generateEmails(linkedInProfile: string)
```

- Review and test the OpenAI integration with stubbed out tool calls
- Implement the tool for enriching company information
  - Prompt used:

```
The tool calls will all be using octive's API. We are going to fill in the details of the tool calls one by one.
The enrichCompany tool will be based on this specification:
@https://docs.octavehq.com/v2-api-reference/agents/enrich-company-agent
The base URL will be @https://dev.octavehq.com and the `agentOId` will come from an environment variable
```

- Review and debug calls to the enrichCompany tool

#### 2.5 Hours

- Reveiw OpenAI tool calling interfaces and features.
  - Update tool calling to return structured data
  - Prompt used:

```
OK. Lets fill in the enrichPerson and generateEmails functions
- Specification for enrichPerson is here @https://docs.octavehq.com/v2-api-reference/agents/enrich-person-agent
- Specification for generate emails is here @https://docs.octavehq.com/v2-api-reference/agents/sequence-agent
- enrichPerson should use the environment variable OCTAVE_ENRICH_PERSON_OID
- generateEmail should use the environment variable OCTAVE_SEQUENCE_OID
```

- Fill in details of tool calls to `enrichPerson` and `generateEmails`
- Debugging of tool flow with OpenAI calls and some prompt engineering

## License

This project is created for development purposes.
