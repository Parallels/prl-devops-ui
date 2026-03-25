import React from 'react';
import { FormField, FormLayout, Panel, Pill, Section, TagPanel } from '@prl/ui-kit';
import { DevOpsRolesAndClaims } from '@/interfaces/devops';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export interface ClaimDetailProps {
  claim: DevOpsRolesAndClaims;
}

export const ClaimDetail: React.FC<ClaimDetailProps> = ({ claim }) => {
  const assignedUsers = claim.users ?? [];
  const { themeColor } = useSystemSettings();

  return (
    <div className="p-6 space-y-6">
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Details" noPadding>
          <FormLayout columns={2}>
            <FormField label="Name">
              <p className="text-sm text-gray-700 dark:text-gray-300">{claim.name ?? '—'}</p>
            </FormField>
            <FormField label="Description">
              <p className="text-sm text-gray-700 dark:text-gray-300">{claim.description || '—'}</p>
            </FormField>
          </FormLayout>
        </Section>
      </Panel>

      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Assigned Users" noPadding>
          <div className="pt-3">
            {assignedUsers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No users assigned to this claim.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <TagPanel tags={assignedUsers.map((u) => ({ label: u.name ?? u.username ?? u.email ?? u.id ?? '', tone: themeColor, variant: 'soft' }))} tagLimit={5} />
              </div>
            )}
          </div>
        </Section>
      </Panel>
    </div>
  );
};

ClaimDetail.displayName = 'ClaimDetail';
export default ClaimDetail;
