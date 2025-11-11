/**
 * LangChain compatibility wrapper
 * This file re-exports LangChain modules to work around TypeScript module resolution issues
 */

// @ts-ignore - Ignore TypeScript errors for these imports
export { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

// @ts-ignore
export { StringOutputParser } from '@langchain/core/output_parsers';

// @ts-ignore
export { ChatPromptTemplate } from '@langchain/core/prompts';

// @ts-ignore
export { ChatOpenAI } from '@langchain/openai';

// @ts-ignore
export { OpenAIEmbeddings } from '@langchain/openai';

