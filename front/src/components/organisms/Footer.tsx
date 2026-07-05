'use client';

import React from 'react';
import { DesignSystem } from '@/types';

/** フッターの props。 */
interface FooterProps {
  /** 配色・フォントなどのデザインシステム */
  theme: DesignSystem;
}

/**
 * ページ最下部に固定表示するフッター。
 * アプリ名・説明と、現在の年を反映した著作権表記を表示する。
 */
const Footer: React.FC<FooterProps> = ({ theme }) => {
  const { colors, fontHeader } = theme;

  return (
    <footer className={`${colors.surface} ${colors.border} border-t py-12 px-8 mt-auto`}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div>
          <div className={`${fontHeader} text-xl font-bold ${colors.primary} mb-2`}>Report Viewer</div>
          <p className={`max-w-xs text-sm ${colors.muted}`}>
            このアプリケーションはレポートビューワーを目的としてます
          </p>
        </div>
      </div>
      <div className={`max-w-6xl mx-auto mt-12 pt-8 border-t border-inherit text-center text-xs ${colors.muted}`}>
        &copy; {new Date().getFullYear()} Report Viewer Systems. All rights reserved. Built with Passion for
        Brown.
      </div>
    </footer>
  );
};

export default Footer;
