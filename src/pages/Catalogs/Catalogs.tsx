import React, { useState } from "react";
import { SplitView, type SplitViewItem, Button, SearchBar, Table, type Column } from "@prl/ui-kit";
import { PageHeader } from "@/components/PageHeader";

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

interface CatalogImage {
  name: string;
  os: string;
  osIcon: string;
  version: string;
  size: string;
  created: string;
}

const productionImages: CatalogImage[] = [
  { name: "Ubuntu-Base", os: "Ubuntu 22.04 LTS", osIcon: "linux", version: "22.04 LTS", size: "19.05 GB", created: "Sep 3, 2024 11:17:13" },
  { name: "Win-Srv-2019", os: "Win3rvs-2019", osIcon: "windows", version: "1.3.1", size: "16.05 GB", created: "Sep 3, 2024 11:17:17" },
  { name: "Redis-Cache", os: "Win3rvs-2019", osIcon: "windows", version: "1.0.1", size: "253.39 GB", created: "Sep 8, 2024 11:15:27" },
  { name: "Redis-Cache-LX", os: "Ubuntu", osIcon: "linux", version: "22.04", size: "6.62 MB", created: "Sep 1, 2024 11:22:04" },
  { name: "Ubuntu-Extended", os: "Ubuntu", osIcon: "linux", version: "22.04 LTS", size: "14.93 GB", created: "Sep 1, 2024 11:22:36" },
];

const stagingImages: CatalogImage[] = [
  { name: "Dev-Box-Ubuntu", os: "Ubuntu 24.04", osIcon: "linux", version: "24.04", size: "8.12 GB", created: "Oct 1, 2024 09:30:00" },
  { name: "Test-Runner", os: "Alpine Linux", osIcon: "linux", version: "3.19", size: "256 MB", created: "Oct 2, 2024 14:15:22" },
];

const legacyImages: CatalogImage[] = [
  { name: "CentOS-7-Base", os: "CentOS 7", osIcon: "linux", version: "7.9", size: "4.20 GB", created: "Jan 15, 2023 08:00:00" },
  { name: "Win-2016-Legacy", os: "Windows Server 2016", osIcon: "windows", version: "1.0.0", size: "22.80 GB", created: "Mar 20, 2022 10:45:00" },
];

/* ------------------------------------------------------------------ */
/*  Image table columns                                                */
/* ------------------------------------------------------------------ */

const imageColumns: Column<CatalogImage>[] = [
  { id: "name", header: "Name", accessor: "name", sortable: true },
  { id: "os", header: "OS", accessor: "os", sortable: true },
  { id: "version", header: "Ver", accessor: "version" },
  { id: "size", header: "Size", accessor: "size" },
  { id: "created", header: "Created", accessor: "created", sortable: true },
];

const ImageTable: React.FC<{ images: CatalogImage[] }> = ({ images }) => (
  <Table<CatalogImage>
    columns={imageColumns}
    data={images}
    variant="flat"
    rowKey={(row) => row.name}
    hoverable
  />
);

/* ------------------------------------------------------------------ */
/*  Panel header builder                                               */
/* ------------------------------------------------------------------ */

const LibraryPanelHeader: React.FC<{ label: React.ReactNode }> = ({ label }) => (
  <PageHeader
    title={<>Library: <span className="text-neutral-700 dark:text-neutral-300">{label}</span></>}
    search={<SearchBar leadingIcon="Search" variant="gradient" glowIntensity="soft" placeholder="Search for images" onSearch={() => { }} className="w-52" />}
    actions={<>
      <Button variant="solid" color="red" size="sm" leadingIcon="Add">Upload ISO</Button>
      <Button variant="outline" color="gray" size="sm" leadingIcon="Settings">Settings</Button>
    </>}
  />
);

/* ------------------------------------------------------------------ */
/*  Split view items                                                   */
/* ------------------------------------------------------------------ */

const libraryItems: SplitViewItem[] = [
  {
    id: "production",
    label: "PRODUCTION REPO",
    subtitle: `${productionImages.length} images`,
    badges: [{ label: "Active", tone: "green", variant: "soft" }],
    panel: <ImageTable images={productionImages} />,
  },
  {
    id: "staging",
    label: "STAGING-REPO",
    subtitle: `${stagingImages.length} images`,
    badges: [],
    panel: <ImageTable images={stagingImages} />,
  },
  {
    id: "legacy",
    label: "LEGACY-ARCHIVE",
    subtitle: `${legacyImages.length} images`,
    badges: [{ label: "Deprecated", tone: "amber", variant: "soft" }],
    panel: <ImageTable images={legacyImages} />,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export const Catalogs: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SplitView
      resizable={true}
      collapsed={collapsed}
      collapsible={true}
      onCollapsedChange={() => setCollapsed(!collapsed)}
      items={libraryItems}
      defaultValue="production"
      listTitle={`Catalogs (${libraryItems.length})`}
      searchPlaceholder="Search"
      color="parallels"
      panelHeader={(activeItem) => <LibraryPanelHeader label={activeItem.label} />}
      className="h-full"
    />
  );
};
