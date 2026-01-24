
import React from 'react';
import { DesignSystem } from '../types';

interface FooterProps {
  theme: DesignSystem;
}

const Footer: React.FC<FooterProps> = ({ theme }) => {
  const { colors, fontHeader } = theme;

  return (
    <footer className={`${colors.surface} ${colors.border} border-t py-12 px-8 mt-auto`}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div>
          <div className={`${fontHeader} text-xl font-bold ${colors.primary} mb-2`}>EarthyDesign</div>
          <p className={`max-w-xs text-sm ${colors.muted}`}>A world-class design system explorer for sophisticated reports and blogs.</p>
        </div>
        <div className="grid grid-cols-2 gap-12 text-sm">
          <div>
            <h4 className={`font-bold ${colors.text} mb-4`}>Product</h4>
            <ul className={`space-y-2 ${colors.muted}`}>
              <li>Changelog</li>
              <li>Documentation</li>
              <li>Style Guide</li>
            </ul>
          </div>
          <div>
            <h4 className={`font-bold ${colors.text} mb-4`}>Legal</h4>
            <ul className={`space-y-2 ${colors.muted}`}>
              <li>Privacy</li>
              <li>Terms</li>
              <li>Cookies</li>
            </ul>
          </div>
        </div>
      </div>
      <div className={`max-w-6xl mx-auto mt-12 pt-8 border-t border-inherit text-center text-xs ${colors.muted}`}>
        &copy; {new Date().getFullYear()} EarthyDesign Systems. All rights reserved. Built with Passion for Brown.
      </div>
    </footer>
  );
};

export default Footer;
