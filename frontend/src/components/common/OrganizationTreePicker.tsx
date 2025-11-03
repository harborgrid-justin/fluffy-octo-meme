import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Input, Badge } from '../ui';
import { Organization } from '@/types';

interface OrganizationTreePickerProps {
  organizations: Organization[];
  selectedId?: string;
  onSelect: (org: Organization) => void;
  showSearch?: boolean;
}

interface TreeNodeProps {
  org: Organization;
  selectedId?: string;
  onSelect: (org: Organization) => void;
  level: number;
}

function TreeNode({ org, selectedId, onSelect, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = org.children && org.children.length > 0;
  const isSelected = org.id === selectedId;

  return (
    <div>
      <div
        className={`flex items-center py-2 px-3 rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        onClick={() => onSelect(org)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}

        <div className="flex-1 flex items-center justify-between">
          <div>
            <div className="font-medium">{org.name}</div>
            <div className="text-xs text-gray-500">{org.code}</div>
          </div>
          <Badge size="sm" variant="default">{org.type}</Badge>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {org.children!.map((child) => (
            <TreeNode
              key={child.id}
              org={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrganizationTreePicker({
  organizations,
  selectedId,
  onSelect,
  showSearch = true
}: OrganizationTreePickerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filterOrganizations = (orgs: Organization[], term: string): Organization[] => {
    if (!term) return orgs;

    return orgs.filter(org => {
      const matches = org.name.toLowerCase().includes(term.toLowerCase()) ||
                     org.code.toLowerCase().includes(term.toLowerCase());

      if (matches) return true;

      if (org.children) {
        const childMatches = filterOrganizations(org.children, term);
        return childMatches.length > 0;
      }

      return false;
    });
  };

  const filteredOrgs = filterOrganizations(organizations, searchTerm);

  return (
    <Card>
      <CardHeader title="Select Organization" subtitle="Choose from organizational hierarchy" />
      <CardContent>
        {showSearch && (
          <div className="mb-4">
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
        )}

        <div className="max-h-96 overflow-y-auto border rounded">
          {filteredOrgs.length > 0 ? (
            filteredOrgs.map((org) => (
              <TreeNode
                key={org.id}
                org={org}
                selectedId={selectedId}
                onSelect={onSelect}
                level={0}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No organizations found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
