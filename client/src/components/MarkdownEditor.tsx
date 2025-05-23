import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  Heading, 
  Link, 
  Image, 
  Code, 
  List, 
  Table 
} from 'lucide-react';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  isPreviewMode: boolean;
}

export function MarkdownEditor({ content, onChange, isPreviewMode }: MarkdownEditorProps) {
  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newContent = 
      content.substring(0, start) + 
      before + textToInsert + after + 
      content.substring(end);
    
    onChange(newContent);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content, onChange]);

  const formatBold = () => insertText('**', '**', 'bold text');
  const formatItalic = () => insertText('*', '*', 'italic text');
  const formatHeading = () => insertText('# ', '', 'heading');
  const insertLink = () => insertText('[', '](url)', 'link text');
  const insertImage = () => insertText('![', '](image-url)', 'alt text');
  const insertCode = () => insertText('`', '`', 'code');
  const insertList = () => insertText('\n- ', '', 'list item');
  const insertTable = () => insertText('\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n', '');

  const renderMarkdown = (markdown: string) => {
    // Simple markdown renderer for preview
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-2 mt-4">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-8">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      // Lists
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return { __html: html };
  };

  if (isPreviewMode) {
    return (
      <div className="flex-1 p-4 prose prose-sm max-w-none">
        <div 
          className="min-h-full text-gray-900 leading-6"
          dangerouslySetInnerHTML={renderMarkdown(content)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex items-center space-x-1">
        <Button variant="ghost" size="sm" onClick={formatBold}>
          <Bold className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={formatItalic}>
          <Italic className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={formatHeading}>
          <Heading className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button variant="ghost" size="sm" onClick={insertLink}>
          <Link className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={insertImage}>
          <Image className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={insertCode}>
          <Code className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button variant="ghost" size="sm" onClick={insertList}>
          <List className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={insertTable}>
          <Table className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor */}
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start writing your note..."
        className="flex-1 resize-none border-none outline-none focus:ring-0 font-mono text-sm leading-6 p-4 rounded-none"
      />
    </div>
  );
}
