import { ExternalLink } from 'lucide-react';
import React, { useState } from 'react';

import type { Paper } from '~/types';

interface PaperTileProps {
  papers: Paper[];
}

const PaperTile: React.FC<PaperTileProps> = ({ papers }) => {
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  const handleExternalClick = (event: React.MouseEvent, url: string) => {
    event.stopPropagation();
    window.open(url, '_blank');
  };

  const handleSourceClick = (event: React.MouseEvent, url: string) => {
    event.stopPropagation();
    window.open(url, '_blank');
  };

  const handleKeyDown = (event: React.KeyboardEvent, url: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
      window.open(url, '_blank');
    }
  };

  return (
    <>
      {papers.map((paper, index) => (
        <div
          key={index}
          className={`group relative p-6 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm
            hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10
            transition-all duration-300 ease-out
            hover:scale-[1.02] hover:-translate-y-1
            bg-white dark:bg-slate-900
            hover:bg-gradient-to-br hover:from-white hover:to-blue-50/30
            dark:hover:from-slate-900 dark:hover:to-blue-950/20
            cursor-pointer overflow-hidden`}
          role="button"
          tabIndex={0}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(-1)}
          onKeyDown={(event) => handleKeyDown(event, paper.url)}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Subtle glow effect (replaces corner accent) */}
          <div className="absolute -top-1 -left-1 w-8 h-8 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out group-hover:scale-150" />

          {/* External link button */}
          <button
            className="absolute top-4 right-4 z-10 w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-110 hover:rotate-12 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/50"
            onClick={(e) => handleExternalClick(e, paper.url)}
            aria-label="Open paper in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="relative z-10 flex flex-col space-y-3">
            {/* Title */}
            <h3 className="text-xl font-bold pr-12 text-gray-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-300 leading-tight">
              {paper.title}
            </h3>

            {/* Authors and journal info */}
            <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
              <span className="font-medium">
                {paper.authors[0]}
                {paper.authors.length > 1 ? ' et al.' : ''}
              </span>
              <span className="mx-2">•</span>
              <span className="italic">{paper.journal}</span>
              <span className="mx-2">•</span>
              <span>{paper.year}</span>
            </p>

            {/* Sources */}
            {paper.sources.length > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <span className="italic text-xs uppercase tracking-wide font-medium">As covered in:</span>
                <div className="flex flex-wrap gap-2">
                  {paper.sources.map((source, sourceIndex) => (
                    <button
                      key={sourceIndex}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 hover:text-blue-800 dark:hover:text-blue-200 transition-all duration-200 text-xs font-medium hover:scale-105 hover:shadow-sm border border-blue-200/50 dark:border-blue-800/50"
                      onClick={(e) => handleSourceClick(e, source.url)}
                    >
                      {source.title.length > 20 ? `${source.title.substring(0, 20)}...` : source.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Animated border */}
          <div
            className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
              hoveredIndex === index ? 'border-blue-200 dark:border-blue-800' : 'border-transparent'
            }`}
          />

          {/* Status indicator dot */}
          <div
            className={`absolute bottom-4 left-4 w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-300 ease-out ${
              hoveredIndex === index ? 'opacity-100 scale-125 shadow-lg shadow-blue-500/50' : 'opacity-0'
            }`}
          />
        </div>
      ))}
    </>
  );
};

export default PaperTile;
