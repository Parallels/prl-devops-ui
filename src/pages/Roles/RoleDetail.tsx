import React from 'react';
import { FormField, FormLayout, Panel, Pill, Section } from '@prl/ui-kit';
import { DevOpsRolesAndClaims } from '@/interfaces/devops';

export interface RoleDetailProps {
  role: DevOpsRolesAndClaims;
}

export const RoleDetail: React.FC<RoleDetailProps> = ({ role }) => {
  const assignedUsers = role.users ?? [];

  return (
    <div className="p-6 space-y-6">
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Profile" noPadding>
          <FormLayout columns={2}>
            <FormField label="Name">
              <p className="text-sm text-gray-700 dark:text-gray-300">{role.name ?? '—'}</p>
            </FormField>
            <FormField label="Description">
              <p className="text-sm text-gray-700 dark:text-gray-300">{role.description || '—'}</p>
            </FormField>
          </FormLayout>
        </Section>
      </Panel>

      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Assigned Users" noPadding>
          <div className="pt-3">
            {assignedUsers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No users assigned to this role.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedUsers.map((u) => (
                  <Pill key={u.id ?? u.username} tone="blue" variant="soft" size="sm">
                    {u.name ?? u.username ?? u.email ?? u.id}
                  </Pill>
                ))}
              </div>
            )}
          </div>
        </Section>
      </Panel>
    </div>
  );
};

RoleDetail.displayName = 'RoleDetail';
export default RoleDetail;
