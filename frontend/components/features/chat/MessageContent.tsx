'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { sanitizeChat } from '@/lib/sanitize';
import { cn } from '@/lib/utils';
import { FileText, Download, ExternalLink } from 'lucide-react';
import type { ChatMessage } from '@/stores/chat.store';

interface MessageContentProps {
  message: ChatMessage;
  compact?: boolean;
}

export function MessageContent({ message, compact }: MessageContentProps) {
  if (message.deleted) {
    return <span className="italic text-muted-foreground text-sm">This message was deleted</span>;
  }

  switch (message.type) {
    case 'code':
      return <CodeBlock content={sanitizeChat(message.text)} filename={message.fileName} />;
    
    case 'image':
      return (
        <div className="mt-1">
          <a 
            href={message.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group relative inline-block overflow-hidden rounded-lg"
          >
            <img
              src={message.fileUrl}
              alt={message.fileName || 'Uploaded image'}
              className="max-h-80 max-w-full object-contain transition-transform group-hover:scale-[1.02]"
              loading="lazy"
            />
          </a>
          {message.fileName && (
            <p className="mt-1 text-xs text-muted-foreground">{message.fileName}</p>
          )}
        </div>
      );

    case 'file':
      return (
        <a
          href={message.fileUrl}
          download={message.fileName}
          className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted transition-colors max-w-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{message.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {message.fileSize ? formatFileSize(message.fileSize) : 'File'}
            </p>
          </div>
          <Download className="h-4 w-4 text-muted-foreground" />
        </a>
      );

    case 'gif':
      return (
        <div className="mt-1">
          <img
            src={message.fileUrl}
            alt="GIF"
            className="max-h-60 rounded-lg object-contain"
            loading="lazy"
          />
        </div>
      );

    case 'markdown':
    case 'text':
    default:
      return (
        <div className={cn('prose prose-invert prose-sm max-w-none', compact && 'prose-xs')}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg !my-2 !bg-black/50"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-primary" {...props}>
                    {children}
                  </code>
                );
              },
              a({ children, href }) {
                // Security: Validate URL before rendering link
                const isSafe = href && (href.startsWith('http://') || href.startsWith('https://'));
                return isSafe ? (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    {children}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">{children}</span>
                );
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground">
                    {children}
                  </blockquote>
                );
              },
            }}
          >
            {sanitizeChat(message.text)}
          </ReactMarkdown>
        </div>
      );
  }
}

function CodeBlock({ content, filename }: { content: string; filename?: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-1 overflow-hidden rounded-lg border border-border bg-black/50">
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
        <span className="text-xs font-mono text-muted-foreground">{filename || 'code'}</span>
        <button
          onClick={copy}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={filename?.split('.').pop() || 'text'}
        customStyle={{ margin: 0, background: 'transparent', padding: '12px 16px' }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
