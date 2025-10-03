import React from 'react';
import type { GroundingSource } from '../types';

interface SourceLinkProps {
  source: GroundingSource;
}

const SourceLink: React.FC<SourceLinkProps> = ({ source }) => {
  const { web } = source;
  if (!web?.uri) {
    return null;
  }

  return (
    <a
      href={web.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
    >
      {web.uri}
    </a>
  );
};

export default SourceLink;