import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CustomIcon, DeleteConfirmModal, EmptyState, IconButton, Library, Pill, SearchBar, SidePanel, SplitView, type SplitViewItem } from '@prl/ui-kit';
import { useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { CatalogManager } from '@/interfaces/CatalogManager';
import { CatalogPushRequest } from '@/interfaces/devops';
import { Claims, Modules } from '@/interfaces/tokenTypes';
import { devopsService } from '@/services/devops';
import { PageHeaderIcon } from '@/components/PageHeader';
import { CatalogDetailContent } from './CatalogDetailPanel';
import { CatalogManagerEditorModal, DeleteCatalogManagerModal } from './CatalogManagerModals';
import { UploadCatalogModal } from './CatalogUploadModal';
import { DownloadCatalogVmModal, DownloadVmFormData } from './CatalogVmModals';
import { CatalogSourcePanel, type CatalogSourceStats } from './CatalogPanels';
import { CatalogManifestItem, CatalogRow, CatalogSource, defaultManagerForm, managerToForm, normalizeForDirtyCheck, toManagerRequest } from './CatalogModels';
import type { CatalogsDeepLinkState } from '@/types/deepLink';

interface SelectedCatalogItem {
  source: CatalogSource;
  manifest: CatalogManifestItem;
}

interface CatalogDeleteTarget {
  source: CatalogSource;
  manifestId: string;
  version?: string;
}

interface CatalogDownloadTarget {
  source: CatalogSource;
  row: CatalogRow;
}

const defaultDownloadVmForm: DownloadVmFormData = {
  owner: '',
  name: '',
  startOnCreate: false,
  path: '',
  cpu: '',
  memory: '',
  target: 'host',
};

const formatCount = (value: number, singular: string, plural: string): string => `${value} ${value === 1 ? singular : plural}`;

export const Catalogs: React.FC = () => {
  const { session, hasModule, hasClaim } = useSession();
  const { themeColor } = useSystemSettings();
  const location = useLocation();
  const deepLink = location.state as CatalogsDeepLinkState | null;
  const hostname = session?.hostname ?? '';
  const sessionUserId = session?.tokenPayload?.uid ?? '';

  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [sources, setSources] = useState<CatalogSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>();
  const [allManagers, setAllManagers] = useState<CatalogManager[]>([]);
  const [sourceStats, setSourceStats] = useState<Record<string, CatalogSourceStats>>({});
  const [catalogReloadToken, setCatalogReloadToken] = useState(0);

  const [selectedCatalogItem, setSelectedCatalogItem] = useState<SelectedCatalogItem | null>(null);

  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<CatalogManager | null>(null);
  const [managerForm, setManagerForm] = useState(defaultManagerForm);
  const [managerFormSnapshot, setManagerFormSnapshot] = useState<string>(normalizeForDirtyCheck(defaultManagerForm));
  const [managerFormError, setManagerFormError] = useState<string | null>(null);
  const [savingManager, setSavingManager] = useState(false);

  const [managerToDelete, setManagerToDelete] = useState<CatalogManager | null>(null);
  const [deletingManager, setDeletingManager] = useState(false);
  const [catalogToDelete, setCatalogToDelete] = useState<CatalogDeleteTarget | null>(null);
  const [deletingCatalog, setDeletingCatalog] = useState(false);
  const [downloadVmModalItem, setDownloadVmModalItem] = useState<CatalogDownloadTarget | null>(null);
  const [downloadVmForm, setDownloadVmForm] = useState<DownloadVmFormData>(defaultDownloadVmForm);
  const [downloadVmError, setDownloadVmError] = useState<string | null>(null);
  const [downloadVmLoading, setDownloadVmLoading] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<'host' | 'orchestrator' | undefined>(deepLink?.downloadTarget);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const hasHostModule = hasModule(Modules.HOST);
  const hasOrchestratorModule = hasModule(Modules.ORCHESTRATOR);

  const hasCreateCatalog = hasClaim(Claims.CATALOG_MANAGER_CREATE);
  const hasCreateCatalogOwn = hasClaim(Claims.CATALOG_MANAGER_CREATE_OWN);
  const hasUpdateManager = hasClaim(Claims.CATALOG_MANAGER_UPDATE);
  const hasUpdateManagerOwn = hasClaim(Claims.CATALOG_MANAGER_UPDATE_OWN);
  const hasPushCatalogClaim = hasClaim(Claims.PUSH_CATALOG_MANIFEST);

  const canCreateCatalog = hasCreateCatalog || hasCreateCatalogOwn;

  const canEditManager = useCallback(
    (manager: CatalogManager): boolean => {
      if (hasUpdateManager) return true;
      return manager.owner_id === sessionUserId && hasUpdateManagerOwn;
    },
    [hasUpdateManager, hasUpdateManagerOwn, sessionUserId],
  );

  const canDeleteManager = useCallback(
    (manager: CatalogManager): boolean => {
      if (hasClaim(Claims.CATALOG_MANAGER_DELETE)) return true;
      return manager.owner_id === sessionUserId && hasClaim(Claims.CATALOG_MANAGER_DELETE_OWN);
    },
    [hasClaim, sessionUserId],
  );

  const fetchCatalogContext = useCallback(async () => {
    if (!hostname) return;

    setLoadingSources(true);
    setSourcesError(null);

    const nextSources: CatalogSource[] = [];
    if (hasModule('catalog')) {
      nextSources.push({
        id: 'local',
        type: 'local',
        title: 'Local Catalogs',
        subtitle: hostname,
      });
    }

    try {
      const managers = (await devopsService.catalogManagers.getCatalogManagers(hostname)) ?? [];
      setAllManagers(managers);

      managers
        .filter((manager) => manager.active)
        .forEach((manager) => {
          nextSources.push({
            id: `manager-${manager.id}`,
            type: 'manager',
            managerId: manager.id,
            title: manager.name,
            subtitle: manager.url,
          });
        });
    } catch (err: any) {
      setAllManagers([]);
      setSourcesError(err?.message ?? 'Failed to load catalog sources');
    } finally {
      setSources(nextSources);
      setLoadingSources(false);
    }
  }, [hasModule, hostname]);

  useEffect(() => {
    void fetchCatalogContext();
  }, [fetchCatalogContext]);

  useEffect(() => {
    if (selectedSourceId && sources.some((src) => src.id === selectedSourceId)) return;
    setSelectedSourceId(sources[0]?.id);
  }, [selectedSourceId, sources]);

  useEffect(() => {
    if (!selectedCatalogItem) return;
    const activeSource = sources.find((src) => src.id === selectedCatalogItem.source.id);
    if (!activeSource || activeSource.id !== selectedSourceId) {
      setSelectedCatalogItem(null);
    }
  }, [selectedCatalogItem, selectedSourceId, sources]);

  const openAddCatalogModal = useCallback(() => {
    setEditingManager(null);
    setManagerForm(defaultManagerForm);
    setManagerFormSnapshot(normalizeForDirtyCheck(defaultManagerForm));
    setManagerFormError(null);
    setIsManagerModalOpen(true);
  }, []);

  const openEditManagerModal = useCallback((manager: CatalogManager) => {
    const form = managerToForm(manager);
    setEditingManager(manager);
    setManagerForm(form);
    setManagerFormSnapshot(normalizeForDirtyCheck(form));
    setManagerFormError(null);
    setIsManagerModalOpen(true);
  }, []);

  const closeManagerModal = useCallback(() => {
    setIsManagerModalOpen(false);
    setSavingManager(false);
    setManagerFormError(null);
  }, []);

  const isEditMode = Boolean(editingManager);
  const isFormDirty = normalizeForDirtyCheck(managerForm) !== managerFormSnapshot;
  const showAdvancedFlags = isEditMode ? hasUpdateManager : hasCreateCatalog;

  const handleSaveManager = useCallback(async () => {
    const payload = toManagerRequest(managerForm);

    if (!payload.name) {
      setManagerFormError('Name is required.');
      return;
    }

    if (!payload.url) {
      setManagerFormError('URL is required.');
      return;
    }

    try {
      new URL(payload.url);
    } catch {
      setManagerFormError('Please provide a valid URL.');
      return;
    }

    if (payload.authentication_method === 'credentials') {
      if (!payload.username || !payload.password) {
        setManagerFormError('Username and password are required for credentials authentication.');
        return;
      }
    } else if (!payload.api_key) {
      setManagerFormError('API key is required for API key authentication.');
      return;
    }

    setSavingManager(true);
    setManagerFormError(null);

    try {
      if (editingManager) {
        const success = await devopsService.catalogManagers.updateCatalogManager(hostname, editingManager.id, payload);
        if (!success) throw new Error('Could not update catalog manager.');
      } else {
        const success = await devopsService.catalogManagers.createCatalogManager(hostname, payload);
        if (!success) throw new Error('Could not create catalog manager.');
      }

      await fetchCatalogContext();
      closeManagerModal();
    } catch (err: any) {
      setManagerFormError(err?.message ?? 'Failed to save catalog manager.');
    } finally {
      setSavingManager(false);
    }
  }, [closeManagerModal, editingManager, fetchCatalogContext, hostname, managerForm]);

  const handleDeleteManager = useCallback(
    async (manager: CatalogManager) => {
      setDeletingManager(true);
      try {
        const success = await devopsService.catalogManagers.deleteCatalogManager(hostname, manager.id);
        if (!success) throw new Error('Could not delete catalog manager.');
        await fetchCatalogContext();
        setManagerToDelete(null);
      } catch (err) {
        console.error('Failed to delete catalog manager:', err);
      } finally {
        setDeletingManager(false);
      }
    },
    [fetchCatalogContext, hostname],
  );

  const handleDeleteCatalog = useCallback(async () => {
    if (!catalogToDelete) return;

    setDeletingCatalog(true);
    try {
      const { source, manifestId, version } = catalogToDelete;

      if (source.type === 'manager' && source.managerId) {
        await devopsService.catalogManagers.removeCatalogManifest(hostname, source.managerId, manifestId, version);
      } else {
        await devopsService.catalog.removeCatalogManifest(hostname, manifestId, version);
      }

      setCatalogToDelete(null);
      setSelectedCatalogItem(null);
      setCatalogReloadToken((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to delete catalog item:', err);
    } finally {
      setDeletingCatalog(false);
    }
  }, [catalogToDelete, hostname]);

  const openDownloadVmModal = useCallback(
    (item: CatalogDownloadTarget) => {
      setDownloadVmModalItem(item);
      setDownloadVmError(null);
      setDownloadVmLoading(false);
      setDownloadVmForm({
        owner: '',
        name: item.row.name !== '-' ? item.row.name : item.row.manifestId,
        startOnCreate: false,
        path: '',
        cpu: item.row.specs.cpu ?? '',
        memory: item.row.specs.memory ?? '',
        target: downloadTarget ?? 'host',
      });
    },
    [downloadTarget],
  );

  const closeDownloadVmModal = useCallback(() => {
    setDownloadVmModalItem(null);
    setDownloadVmError(null);
    setDownloadVmLoading(false);
    setDownloadTarget(undefined);
  }, []);

  const handleDownloadVm = useCallback(async () => {
    if (!downloadVmModalItem) return;

    const trimmedName = downloadVmForm.name.trim();
    const trimmedOwner = downloadVmForm.owner.trim();
    const architecture = downloadVmModalItem.row.architecture?.trim();

    if (!trimmedName) {
      setDownloadVmError('VM name is required.');
      return;
    }
    if (!architecture || architecture === '-') {
      setDownloadVmError('Architecture is missing for this catalog item.');
      return;
    }

    const specs: { cpu?: string; memory?: string } = {};
    if (downloadVmForm.cpu.trim()) specs.cpu = downloadVmForm.cpu.trim();
    if (downloadVmForm.memory.trim()) specs.memory = downloadVmForm.memory.trim();
    const trimmedPath = downloadVmForm.path.trim();

    setDownloadVmLoading(true);
    setDownloadVmError(null);

    try {
      const catalogManifestPayload: {
        catalog_id: string;
        version?: string;
        catalog_manager_id?: string;
        path?: string;
        specs?: { cpu?: string; memory?: string };
      } = {
        catalog_id: downloadVmModalItem.row.manifestId,
        version: downloadVmModalItem.row.version !== '-' ? downloadVmModalItem.row.version : undefined,
        catalog_manager_id: downloadVmModalItem.source.managerId,
        ...(trimmedPath ? { path: trimmedPath } : {}),
        ...(Object.keys(specs).length > 0 ? { specs } : {}),
      };

      await devopsService.machines.createVirtualMachineFromCatalogAsync(
        hostname,
        {
          name: trimmedName,
          startOnCreate: downloadVmForm.startOnCreate,
          architecture,
          owner: trimmedOwner,
          catalog_manifest: catalogManifestPayload,
        },
        downloadVmForm.target === 'orchestrator',
      );
      closeDownloadVmModal();
    } catch (err: any) {
      setDownloadVmError(err?.message ?? 'Failed to start VM download.');
    } finally {
      setDownloadVmLoading(false);
    }
  }, [closeDownloadVmModal, downloadVmForm, downloadVmModalItem, hostname]);

  const handleUploadCatalog = useCallback(
    async (data: CatalogPushRequest) => {
      setUploadLoading(true);
      setUploadError(null);
      try {
        const activeSource = sources.find((src) => src.id === selectedSourceId);
        if (activeSource?.type === 'manager' && activeSource.managerId) {
          await devopsService.catalogManagers.pushCatalogAsync(hostname, activeSource.managerId, data);
        } else {
          await devopsService.catalog.pushCatalogAsync(hostname, data);
        }
        setIsUploadModalOpen(false);
        setCatalogReloadToken((prev) => prev + 1);
      } catch (err: any) {
        setUploadError(err?.message ?? 'Failed to upload catalog.');
      } finally {
        setUploadLoading(false);
      }
    },
    [hostname, sources, selectedSourceId],
  );

  const items = useMemo<SplitViewItem[]>(
    () =>
      sources.map((source) => {
        const manager = source.type === 'manager' ? allManagers.find((entry) => entry.id === source.managerId) : undefined;

        const actions =
          source.type === 'manager' && manager ? (
            <div className="flex items-center gap-1">
              {canEditManager(manager) && (
                <IconButton
                  icon="Edit"
                  size="xs"
                  variant="ghost"
                  color={themeColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditManagerModal(manager);
                  }}
                  aria-label="Edit catalog manager"
                />
              )}
              {canDeleteManager(manager) && (
                <IconButton
                  icon="Trash"
                  size="xs"
                  variant="ghost"
                  color="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setManagerToDelete(manager);
                  }}
                  aria-label="Delete catalog manager"
                />
              )}
            </div>
          ) : undefined;

        return {
          id: source.id,
          label: source.title,
          subtitle: source.subtitle,
          actions,
          panel: (
            <CatalogSourcePanel
              hostname={hostname}
              source={source}
              query={query}
              reloadToken={catalogReloadToken}
              selectedManifestId={selectedCatalogItem?.source.id === source.id ? selectedCatalogItem.manifest.id : undefined}
              onManifestClick={(manifest) => {
                setSelectedCatalogItem({ source, manifest });
              }}
              onDownloadRow={(row) => openDownloadVmModal({ source, row })}
              onStatsChange={(stats) => {
                setSourceStats((prev) => ({ ...prev, [source.id]: stats }));
              }}
            />
          ),
        };
      }),
    [allManagers, canDeleteManager, canEditManager, catalogReloadToken, hostname, openDownloadVmModal, openEditManagerModal, query, setSourceStats, sources],
  );

  const panelEmptyState = () => (
    <EmptyState
      disableBorder
      icon="Library"
      title="No catalogs available"
      subtitle="No local or external catalog sources are currently available."
      tone="neutral"
      fullWidth
      onAction={() => void openAddCatalogModal()}
      actionLabel="Add Catalog"
      actionColor={themeColor}
      actionLeadingIcon="Add"
    />
  );

  return (
    <div className="relative flex h-full min-h-0">
      <SplitView
        className="flex-1 min-w-0"
        resizable
        collapsed={collapsed}
        collapsible
        onCollapsedChange={() => setCollapsed(!collapsed)}
        items={items}
        value={selectedSourceId}
        onChange={(id) => {
          setSelectedSourceId(id);
          setSelectedCatalogItem(null);
          setDownloadTarget(undefined);
        }}
        loading={loadingSources}
        error={sourcesError ?? undefined}
        onRetry={() => void fetchCatalogContext()}
        listTitle={`Catalogs (${items.length})`}
        listActions={canCreateCatalog ? <IconButton icon="Add" size="sm" variant="ghost" color={themeColor} onClick={openAddCatalogModal} /> : undefined}
        searchPlaceholder="Search sources"
        color={themeColor}
        panelHeaderProps={(activeItem) => {
          const stats = sourceStats[activeItem.id] ?? { manifests: 0, versions: 0, images: 0 };
          const hasDetails = stats.manifests > 0 || stats.versions > 0 || stats.images > 0;
          const hasItems = stats.manifests > 0;
          setActiveItem(activeItem.id)


          return {
            title: <span className="text-neutral-700 dark:text-neutral-300">{activeItem.label}</span>,
            icon: (
              <PageHeaderIcon color={themeColor}>
                <CustomIcon icon="Library" className="w-5 h-5" />
              </PageHeaderIcon>
            ),
            subtitle: activeItem.subtitle,
            search: hasItems ? (
              <SearchBar leadingIcon="Search" variant="gradient" glowIntensity="soft" placeholder="Search catalogs, versions, tags" onSearch={setQuery} color={themeColor} />
            ) : undefined,
            searchWidth: 'sm:w-20 md:w-70',
            helper: {
              title: 'Upload Catalog',
              color: themeColor,
              content:
                'Catalogs are used to store and manage catalog metadata for download of virtual machines golden images for each user. [See documentation](https://parallels.github.io/prl-devops-service/docs/devops/catalog/overview/)',
            },
            actions: hasPushCatalogClaim && hasModule('host') ? (
              <IconButton
                tooltip='Upload Catalog Image'
                icon="Push"
                variant="ghost"
                color={themeColor}
                size="sm"
    
                onClick={() => {
                  setIsUploadModalOpen(true);
                  setUploadError(null);
                }}
            />
            ) : undefined,
            headerDetails: hasDetails
              ? {
                  title: 'Catalog Overview',
                  tone: 'neutral',
                  variant: 'subtle',
                  decoration: 'none',
                  bordered: false,
                  tags: (
                    <>
                      <Pill size="sm" tone={themeColor} variant="soft">
                        {formatCount(stats.manifests, 'manifest', 'manifests')}
                      </Pill>
                      <Pill size="sm" tone="info" variant="soft">
                        {formatCount(stats.versions, 'version', 'versions')}
                      </Pill>
                      <Pill size="sm" tone="neutral" variant="soft">
                        {formatCount(stats.images, 'image', 'images')}
                      </Pill>
                    </>
                  ),
                }
              : undefined,
          };
        }}
        panelEmptyState={panelEmptyState()}
      />

      <SidePanel
        icon={<Library className={`w-5 h-5 text-${themeColor}-500`} />}
        subtitle={selectedCatalogItem?.manifest.versions.length ? `${selectedCatalogItem.manifest.versions.length} version${selectedCatalogItem.manifest.versions.length > 1 ? 's' : ''}` : undefined}
        isOpen={!!selectedCatalogItem}
        onClose={() => setSelectedCatalogItem(null)}
        title={selectedCatalogItem?.manifest.title ?? 'Catalog Details'}
        width={520}
        resizable
      >
        {selectedCatalogItem && (
          <div className="h-full overflow-y-auto">
            <CatalogDetailContent
              manifest={selectedCatalogItem.manifest}
              hostname={hostname}
              source={selectedCatalogItem.source}
              canEdit={hasPushCatalogClaim}
              onReload={() => setCatalogReloadToken((prev) => prev + 1)}
              onClose={() => setSelectedCatalogItem(null)}
              onPullRow={(row) => openDownloadVmModal({ source: selectedCatalogItem.source, row })}
            />
          </div>
        )}
      </SidePanel>

      <CatalogManagerEditorModal
        isOpen={isManagerModalOpen}
        isEditMode={isEditMode}
        showAdvancedFlags={showAdvancedFlags}
        savingManager={savingManager}
        isFormDirty={isFormDirty}
        managerForm={managerForm}
        managerFormError={managerFormError}
        onClose={closeManagerModal}
        onSave={() => void handleSaveManager()}
        onFormChange={setManagerForm}
      />

      <DeleteCatalogManagerModal
        manager={managerToDelete}
        deleting={deletingManager}
        onClose={() => setManagerToDelete(null)}
        onConfirm={() => managerToDelete && void handleDeleteManager(managerToDelete)}
      />

      <DeleteConfirmModal
        isOpen={!!catalogToDelete}
        onClose={() => setCatalogToDelete(null)}
        onConfirm={() => void handleDeleteCatalog()}
        title="Delete Catalog Item"
        icon="Trash"
        confirmLabel={deletingCatalog ? 'Deleting…' : 'Delete'}
        isConfirmDisabled={deletingCatalog}
        confirmValue={catalogToDelete?.manifestId ?? ''}
        confirmValueLabel="catalog manifest name"
        size="md"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">This action is irreversible and removes the selected catalog manifest/version from this source.</p>
      </DeleteConfirmModal>

      <UploadCatalogModal
        isOpen={isUploadModalOpen}
        hostname={hostname}
        loading={uploadLoading}
        error={uploadError}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadError(null);
        }}
        onSubmit={(data) => void handleUploadCatalog(data)}
      />

      <DownloadCatalogVmModal
        isOpen={!!downloadVmModalItem}
        loading={downloadVmLoading}
        error={downloadVmError}
        form={downloadVmForm}
        isLocal={activeItem === 'local'}
        catalogId={downloadVmModalItem?.row.manifestId ?? ''}
        version={downloadVmModalItem?.row.version !== '-' ? downloadVmModalItem?.row.version : undefined}
        architecture={downloadVmModalItem?.row.architecture !== '-' ? downloadVmModalItem?.row.architecture : undefined}
        managerId={downloadVmModalItem?.source.managerId}
        hasHostModule={hasHostModule}
        hasOrchestratorModule={hasOrchestratorModule}
        forcedTarget={downloadTarget}
        onClose={closeDownloadVmModal}
        onSubmit={() => void handleDownloadVm()}
        onFormChange={setDownloadVmForm}
      />
    </div>
  );
};
