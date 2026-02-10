import React from "react";
import { SplitView, type SplitViewItem, Button, SearchBar } from "@prl/ui-kit";

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
/*  Image table                                                        */
/* ------------------------------------------------------------------ */

const ImageTable: React.FC<{ images: CatalogImage[] }> = ({ images }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
          <th className="px-4 py-3">Name</th>
          <th className="px-4 py-3">OS</th>
          <th className="px-4 py-3">Ver</th>
          <th className="px-4 py-3">Size</th>
          <th className="px-4 py-3">Created</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {images.map((img) => (
          <tr key={img.name} className="hover:bg-gray-50/60 transition-colors">
            <td className="px-4 py-3 font-medium text-gray-900">{img.name}</td>
            <td className="px-4 py-3 text-gray-600">{img.os}</td>
            <td className="px-4 py-3 text-gray-600">{img.version}</td>
            <td className="px-4 py-3 text-gray-600">{img.size}</td>
            <td className="px-4 py-3 text-gray-500">{img.created}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Panel header builder                                               */
/* ------------------------------------------------------------------ */

const LibraryPanelHeader: React.FC<{ label: React.ReactNode }> = ({ label }) => (
  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
    <h2 className="text-lg font-semibold text-gray-900">
      Library: <span className="text-gray-700">{label}</span>
    </h2>
    <div className="flex items-center gap-3">
      <SearchBar placeholder="Search for images" onSearch={() => {}} className="w-52" />
      <Button variant="solid" color="red" size="sm" leadingIcon="Add">Upload ISO</Button>
      <Button variant="outline" color="gray" size="sm" leadingIcon="Settings">Settings</Button>
    </div>
  </div>
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

export const Libraries: React.FC = () => {
  return (
    <SplitView
      items={libraryItems}
      defaultValue="production"
      listTitle={`Libraries (${libraryItems.length})`}
      searchPlaceholder="Search"
      color="blue"
      panelHeader={(activeItem) => <LibraryPanelHeader label={activeItem.label} />}
      className="h-full"
    />
  );
};
