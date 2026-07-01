'use client';

import { useState, KeyboardEvent } from 'react';
import { updateInvoiceTags } from '@/app/actions';

interface TagEditorProps {
  invoiceId: number;
  initialTags: string[];
}

export default function TagEditor({ invoiceId, initialTags }: TagEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddTag = async (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    
    const newTags = [...tags, trimmed];
    setTags(newTags);
    setInputValue('');
    
    setIsSaving(true);
    try {
      await updateInvoiceTags(invoiceId, newTags);
    } catch (error) {
      console.error('Error adding tag:', error);
      // Revert if error
      setTags(tags);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    
    setIsSaving(true);
    try {
      await updateInvoiceTags(invoiceId, newTags);
    } catch (error) {
      console.error('Error removing tag:', error);
      // Revert if error
      setTags(tags);
    } finally {
      setIsSaving(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {tags.map(tag => (
        <span 
          key={tag} 
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
        >
          {tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTag(tag);
            }}
            className="hover:text-blue-600 focus:outline-none"
            aria-label={`Remove tag ${tag}`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          onClick={(e) => e.stopPropagation()} // Prevent row click
          placeholder="Añadir etiqueta..."
          className="text-xs bg-transparent border-b border-dashed border-muted-foreground/50 focus:border-primary focus:outline-none w-28 py-1 placeholder:text-muted-foreground"
          disabled={isSaving}
        />
        {isSaving && (
          <svg className="animate-spin w-3 h-3 text-muted-foreground absolute right-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </div>
    </div>
  );
}
