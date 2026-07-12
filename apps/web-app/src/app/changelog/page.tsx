import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import fs from 'fs/promises';
import path from 'path';

interface ChangelogEntry {
  version: string;
  date: string;
  sections: {
    title: string;
    items: {
      text: string;
      commitHash?: string;
      commitUrl?: string;
    }[];
  }[];
}

async function getChangelog(): Promise<ChangelogEntry[]> {
  try {
    const filePath = path.join(process.cwd(), '../../CHANGELOG.md');
    const fileContent = await fs.readFile(filePath, 'utf8');
    return parseChangelog(fileContent);
  } catch (error) {
    console.error('Failed to read changelog:', error);
    return [];
  }
}

function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = markdown.split('\n');
  
  let currentEntry: ChangelogEntry | null = null;
  let currentSection: { title: string; items: { text: string; commitHash?: string; commitUrl?: string; }[] } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Version header (## 0.3.0 (2024-12-26))
    if (line.startsWith('## ')) {
      if (currentEntry) {
        entries.push(currentEntry);
      }
      
      const versionMatch = line.match(/## ([\d\.]+) \(([\d-]+)\)/);
      if (versionMatch) {
        currentEntry = {
          version: versionMatch[1],
          date: versionMatch[2],
          sections: []
        };
      }
      continue;
    }
    
    // Section header (### Features)
    if (line.startsWith('### ') && currentEntry) {
      if (currentSection) {
        currentEntry.sections.push(currentSection);
      }
      
      currentSection = {
        title: line.replace('### ', ''),
        items: []
      };
      continue;
    }
    
    // List item (* :sparkles: add release it ([8c1d468](https://github.com/...)))
    if (line.startsWith('* ') && currentSection) {
      // Extract commit hash and URL if present
      const commitMatch = line.match(/\(([a-f0-9]{7,})\)/);
      const urlMatch = line.match(/\((https:\/\/github\.com\/[^)]+)\)/);
      
      // Clean up emoji codes and format the item
      let cleanedItem = line.replace('* ', '')
        .replace(/:([\w-]+):/g, '') // Remove emoji codes
        .replace(/\([a-f0-9]{7,}\)/g, '') // Remove commit hash
        .replace(/\(https:\/\/github\.com\/[^)]+\)/g, '') // Remove URL
        .trim();
      
      // Capitalize first letter if it's not already
      if (cleanedItem.length > 0) {
        cleanedItem = cleanedItem.charAt(0).toUpperCase() + cleanedItem.slice(1);
      }
      
      currentSection.items.push({
        text: cleanedItem,
        commitHash: commitMatch ? commitMatch[1] : undefined,
        commitUrl: urlMatch ? urlMatch[1] : undefined
      });
    }
  }
  
  // Add the last section and entry
  if (currentSection && currentEntry) {
    currentEntry.sections.push(currentSection);
  }
  
  if (currentEntry) {
    entries.push(currentEntry);
  }
  
  return entries;
}

// Function to get a badge color based on section title
function getSectionBadgeColor(title: string): string {
  switch (title.toLowerCase()) {
    case 'features':
      return 'bg-green-100 text-green-800';
    case 'bug fixes':
      return 'bg-red-100 text-red-800';
    case 'performance':
      return 'bg-blue-100 text-blue-800';
    case 'documentation':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default async function ChangelogPage() {
  const changelog = await getChangelog();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to app
        </Link>
      </div>
      
      <h1 className="text-4xl font-bold mb-8">Changelog</h1>
      <p className="text-gray-600 mb-12">New updates and improvements to Ruler.</p>
      
      {changelog.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No changelog entries found.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {changelog.map((entry, index) => (
            <div key={index} className="border-t pt-12 first:border-t-0 first:pt-0">
              <div className="mb-8">
                <div className="text-sm text-gray-500 mb-2">{formatDate(entry.date)}</div>
                <h2 className="text-2xl font-bold">Version {entry.version}</h2>
              </div>
              
              {entry.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-10">
                  <div className="flex items-center mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSectionBadgeColor(section.title)}`}>
                      {section.title}
                    </span>
                  </div>
                  
                  <ul className="space-y-4">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <div className="h-2 w-2 rounded-full bg-gray-400 mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <span className="text-gray-800">{item.text}</span>
                          {item.commitHash && item.commitUrl && (
                            <a 
                              href={item.commitUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {item.commitHash.substring(0, 7)}
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 