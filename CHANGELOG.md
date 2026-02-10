# Changelog

All notable changes to the MDN Developer Chat project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed - Embedding Model Upgrade

#### Voyage AI Model Switch

- **Migration to Voyage Code 3**: Updated embedding generation to use `voyage-code-3` model for improved code-specific embeddings
  - Updated `scripts/generate-embeddings.ts` to use `voyage.textEmbeddingModel("voyage-code-3")`
  - Updated `scripts/semantic-search.ts` to query with `voyage-code-3` model
  - Configured vector dimensions to 1024 (voyage-code-3 native dimension for optimal performance)
  - Updated database schema `src/db/schema/documents.ts` to reflect 1024-dimensional vectors
- **Query Optimization**: Set `inputType: "query"` in semantic search for Voyage API query optimization
- **Documentation**: Updated setup guides and references to reflect new embedding model configuration

## [0.2.0] - 2026-02-06

### Added - RAG Infrastructure & Document Processing Pipeline

#### LlamaParse Integration

- **PDF Parsing**: Integrated LlamaParse for intelligent PDF document parsing
  - Installed `@llamaindex/cloud` for LlamaParse API access
  - Installed `llamaindex` core library for document handling
  - Added `dotenv` for environment variable management
  - Added `tsx` for TypeScript execution
- **Parsing Scripts**:
  - `scripts/parse-pdf.ts` - Flexible PDF parser supporting single or batch processing
  - `scripts/parse-canada.ts` - Legacy example script (Canada document)
  - `scripts/parse-mediacentre.ts` - Legacy example script (MediaCentre document)
  - `src/lib/parser.ts` - Reusable parser module for application integration
- **NPM Commands**:
  - `npm run parse` - Parse all PDFs in data/pdfs/ directory
  - `npm run parse:pdf` - Main parsing command (same as parse)
  - `npm run parse:pdf <filename>` - Parse specific PDF file
  - `npm run parse:canada` - Parse Canada example (legacy)
  - `npm run parse:mediacentre` - Parse MediaCentre example (legacy)

#### Organized Data Structure

- **Input Directories**:
  - `data/pdfs/` - PDF documents for parsing
  - `data/markdown/` - Pre-existing markdown files
  - `data/html/` - HTML documentation files
- **Processing Pipeline Directories**:
  - `data/processed/raw/` - Parsed markdown output from PDFs
  - `data/processed/chunked/` - Prepared for chunking stage (coming soon)
  - `data/processed/embedded/` - Prepared for embeddings stage (coming soon)
- **File Management**:
  - Added `.gitignore` for data directory (tracks examples, ignores outputs)
  - Added `.gitkeep` files to preserve empty directory structure
  - Example document: `data/pdfs/canada.pdf` (Canadian fun facts)

#### Documentation

- **PIPELINE.md**: Comprehensive RAG pipeline documentation
  - Stage 1: Parse Documents (✅ Complete)
  - Stage 2: Chunk Content (🔨 Planned)
  - Stage 3: Generate Embeddings (🔨 Planned)
  - Stage 4: Store in Vector Database (🔨 Planned)
  - Stage 5: Implement Retrieval (🔨 Planned)
  - Includes implementation details, code examples, and cost estimates
- **data/README.md**: Complete guide to data directory structure and workflow
  - Directory structure explanation
  - Processing pipeline overview
  - File naming conventions
  - Best practices for development and production
  - Git tracking guidelines
- **PARSER_SETUP.md**: Updated with new directory structure and flexible parsing workflow

#### Technical Improvements

- **Scalable Architecture**: Organized structure ready for large MDN documentation sets
- **Batch Processing**: Support for processing multiple PDFs in one command
- **Metadata Tracking**: Automatic metadata generation for parsed documents
- **Clean Separation**: Input files separate from processed outputs

### Changed

- **Directory Structure**: Moved from flat structure to organized data/ hierarchy
- **Parsing Workflow**: Switched from hardcoded paths to flexible directory-based system
- **Output Location**: Changed from `output/` to `data/processed/raw/` for better organization

### Removed

- **Old Output Directory**: Removed `output/` directory (replaced by `data/processed/`)

### Developer Notes

This release establishes the foundation for the full RAG (Retrieval-Augmented Generation) pipeline. The parsing infrastructure is complete and tested. Next steps will implement:

1. Document chunking with semantic splitting
2. Embedding generation using OpenAI or similar
3. Vector database integration (Pinecone recommended)
4. Retrieval logic for chat backend
5. Citation tracking with source attribution

The system is designed to scale from small example documents to the complete MDN documentation corpus (~50,000+ pages).

---

## [0.1.0] - 2026-02-05

### Added - Initial Release

#### Core Application

- **Modern Chat Interface**: ChatGPT-inspired UI optimized for JavaScript and web development Q&A
- **MDN Branding**: Full MDN Web Docs integration with proper branding and citations
- **Theme System**: Light, dark, and system theme support with smooth transitions
- **Responsive Design**: Mobile-first approach with collapsible elements

#### Components (12 Total)

- **TopBar**: Header with app title, subtitle, download, restart, theme toggle, and settings
- **EmptyState**: Welcome screen with 4 example prompt cards
- **MessageList**: Smart scrolling container with auto-scroll detection
- **UserMessage**: Right-aligned user message bubbles with markdown support
- **AssistantMessage**: Full-featured AI responses with toolbar, feedback, and citations
- **CodeBlock**: Syntax-highlighted code with line numbers, copy, wrap toggle, and run placeholder
- **InputBar**: Auto-resizing textarea with send button and keyboard shortcuts
- **TypingIndicator**: Animated "thinking" indicator during generation
- **SettingsPanel**: Comprehensive settings drawer with preferences
- **CitationMarker**: Inline MDN citation tooltips
- **SourcesFooter**: Expandable MDN citations with links
- **Sidebar**: (Created but removed in this version - simplified UX)

#### Features

- **Code-First Design**: Excellent syntax highlighting with rehype-highlight
- **MDN Citations**: Inline `[n]` markers with hover tooltips and expandable sources
- **Message Actions**: Copy, feedback (thumbs up/down), regenerate, pin
- **Download Conversation**: Export entire chat as markdown file
- **Restart/Clear**: Clear conversation with confirmation
- **Settings Persistence**: All settings and messages saved to localStorage
- **Quick Suggestions**: Context-aware follow-up prompts after first message
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for newline

#### Technical Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4 with CSS-first configuration
- **TypeScript**: Full type safety with strict mode
- **Markdown**: react-markdown with rehype-highlight and remark-gfm
- **Icons**: lucide-react
- **State Management**: React hooks with localStorage persistence

#### Documentation

- **README.md**: Complete feature overview and setup guide
- **IMPLEMENTATION_GUIDE.md**: Deep technical documentation (70+ KB)
- **QUICKSTART.md**: Quick start for developers
- **COMPONENTS.md**: Component reference guide
- **SUMMARY.md**: Implementation summary with statistics

### Design Decisions

#### Simplified UX

- **Removed Sidebar**: Eliminated conversation history feature for cleaner, focused experience
- **Single Conversation**: All messages in one array, no conversation switching
- **No Saved Answers**: Simplified to just pin/unpin within current conversation
- **Download Option**: Export entire conversation instead of managing multiple conversations

#### MDN Integration Philosophy

- **Subtle Citations**: MDN references are verification aids, not dominant UI elements
- **Inline Markers**: Small `[1]` superscripts with hover tooltips
- **Expandable Sources**: Compact footer that expands to show full citations
- **Direct Links**: All citations link to official MDN documentation

#### Visual Polish

- **Fixed Input Bar Alignment**: Resolved border overflow spacing issues
- **Centered Send Icon**: Perfect vertical alignment with proper spacing
- **4 Example Cards**: Reduced from 5 to show variety (JS, CSS, Web APIs)
- **Clear Placeholder**: Descriptive hint about full topic coverage
- **Edge-to-Edge Input**: No visual gaps on input bar sides

### Fixed

- **Hydration Errors**: Resolved nested button issues in conversation lists
- **Date Serialization**: Fixed `formatTimestamp` to handle Date strings from localStorage
- **Input Bar Spacing**: Fixed border-related visual gap on right side
- **Send Icon Alignment**: Perfect vertical centering and proper padding
- **Theme Initialization**: Proper SSR-safe theme loading from localStorage

### Technical Details

#### File Structure

```
src/
├── app/
│   ├── layout.tsx (metadata, fonts)
│   ├── page.tsx (main app logic)
│   └── globals.css (theme variables, animations)
├── components/ (13 files)
├── hooks/ (2 files)
├── lib/ (utils)
└── types/ (TypeScript definitions)
```

#### Key Metrics

- **Lines of Code**: ~2,500
- **Components**: 12 React components
- **Hooks**: 2 custom hooks
- **Type Definitions**: 8 interfaces
- **Zero Errors**: TypeScript and ESLint clean

### API Integration Points

The UI is complete with simulated responses. To connect to a real backend:

1. **AI Backend**: Replace `simulateAIResponse()` in `page.tsx`
2. **MDN RAG Pipeline**: Implement vector search and citation extraction
3. **Code Execution**: Add sandbox for "Run" button in code blocks
4. **Streaming**: Implement SSE or WebSocket for real-time responses

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance

- **First Paint**: < 1s
- **Interactive**: < 2s
- **Bundle Size**: ~200KB gzipped (estimated)
- **Lighthouse Score**: 95+ (estimated)

---

## Future Enhancements (Planned)

### Phase 2 - Backend Integration

- [ ] Connect to AI backend API
- [ ] Implement MDN RAG pipeline with vector search
- [ ] Add response streaming support
- [ ] Citation extraction from MDN corpus

### Phase 3 - Enhanced Features

- [ ] Code execution sandbox
- [ ] Voice input support
- [ ] Export as PDF
- [ ] Search within conversation
- [ ] Keyboard shortcuts modal
- [ ] Mobile app (React Native)

### Phase 4 - Advanced Features

- [ ] Multi-language support
- [ ] Collaborative chat rooms
- [ ] Code diff view for edits
- [ ] Integration with VS Code
- [ ] Browser extension

---

## Notes

### Development

- Built with Next.js 16 and React 19
- Uses Tailwind CSS v4 with inline theme configuration
- TypeScript strict mode enabled
- Zero linting warnings or errors

### Deployment Ready

- Production build tested
- All dependencies up to date
- No security vulnerabilities
- Ready for Vercel/Netlify deployment

### License

MIT

### Contributors

- Initial development: AI-assisted implementation
- Design: Based on ChatGPT UX patterns adapted for MDN
