'use client';

import React from 'react';
import { DesignSystem } from '../types';
import { CATEGORIES } from '../constants';

interface SidebarProps {
  theme: DesignSystem;
  tags: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  theme,
  tags,
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
}) => {
  const { colors, fontHeader, sidebarStyle, borderRadius } = theme;

  const normalizeTag = (tag: string) => tag.replace(/^#/, '').trim();
  const normalizeTagValue = (tag: string) => normalizeTag(tag).toLowerCase();
  const visibleTags = Array.from(
    new Set(tags.map(normalizeTag).filter(Boolean)),
  ).map((tag) => ({
    label: tag,
    value: normalizeTagValue(tag),
  }));

  return (
    <aside
      className={`${
        sidebarStyle === 'full-height' ? 'h-full border-r' : 'py-8'
      } ${colors.border} px-6 transition-all duration-300 min-w-[240px] hidden md:block`}
    >
      <div className="space-y-12 sticky top-32 mt-4">
        <div>
          <h3 className={`${fontHeader} text-xs uppercase tracking-widest ${colors.muted} mb-6`}>
            Categories
          </h3>
          <ul className="space-y-4 text-sm">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <button
                  type="button"
                  aria-pressed={selectedCategory === cat}
                  onClick={() => onSelectCategory(selectedCategory === cat ? null : cat)}
                  className={`${colors.text} cursor-pointer hover:opacity-70 border-b border-transparent hover:border-current transition-all inline-block pb-1 ${
                    selectedCategory === cat ? 'font-bold border-current' : 'opacity-70'
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={`${fontHeader} text-xs uppercase tracking-widest ${colors.muted} mb-4`}>
            Trending Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {visibleTags.length > 0 ? (
              visibleTags.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selectedTag === value}
                  className={`text-[10px] px-2 py-1 ${colors.accent} text-white ${borderRadius} cursor-pointer hover:brightness-125 transition-all before:mr-0.5 before:content-['#'] ${
                    selectedTag === value
                      ? 'ring-2 ring-[#2a1b12] ring-offset-2 ring-offset-[#faf7f5] scale-[1.05] brightness-110 shadow-md'
                      : 'opacity-70'
                  }`}
                  onClick={() => onSelectTag(selectedTag === value ? null : value)}
                >
                  {label}
                </button>
              ))
            ) : (
              <span className={`text-[10px] ${colors.muted}`}>No tags</span>
            )}
          </div>
        </div>

        <div className={`mt-20 pt-8 border-t ${colors.border}`}>
          <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-4 text-[#3d2b1f] opacity-40">
            Director's Manifesto
          </p>
          <div className="relative pl-4 border-l-2 border-[#5c4033]">
            <p className={`${fontHeader} text-sm italic leading-relaxed ${colors.text} opacity-90`}>
              "True design is the intersection of logic and emotion."
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-4 h-[1px] bg-[#3d2b1f] opacity-30"></div>
              <span className="text-[10px] font-bold tracking-widest opacity-60">H. TANAKA</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
