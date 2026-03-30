import React from 'react';
import { Add } from './components/Add';
import { ArrowDown } from './components/ArrowDown';
import { ArrowLeft } from './components/ArrowLeft';
import { ArrowRight } from './components/ArrowRight';
import { ArrowUp } from './components/ArrowUp';
import { Attached } from './components/Attached';
import { Attachment } from './components/Attachment';
import { Back } from './components/Back';
import { Blueprint } from './components/Blueprint';
import { Bug } from './components/Bug';
import { Chat } from './components/Chat';
import { CheckCircle } from './components/CheckCircle';
import { ChevronLeft } from './components/ChevronLeft';
import { ChevronRight } from './components/ChevronRight';
import { Clean } from './components/Clean';
import { Close } from './components/Close';
import { Close1 } from './components/Close1';
import { CloudOff } from './components/CloudOff';
import { Cog } from './components/Cog';
import { Complete } from './components/Complete';
import { Container } from './components/Container';
import { CopyClipboard } from './components/CopyClipboard';
import { Dashboard } from './components/Dashboard';
import { Details } from './components/Details';
import { DockerCopy } from './components/DockerCopy';
import { Docker } from './components/Docker';
import { Dots } from './components/Dots';
import { Download } from './components/Download';
import { Edit } from './components/Edit';
import { Equal } from './components/Equal';
import { Error } from './components/Error';
import { Export } from './components/Export';
import { EyeClosed } from './components/EyeClosed';
import { EyeOpen } from './components/EyeOpen';
import { Globe } from './components/Globe';
import { Help } from './components/Help';
import { Idea } from './components/Idea';
import { Image } from './components/Image';
import { Info } from './components/Info';
import { Key } from './components/Key';
import { LXCOld } from './components/LXCOld';
import { LXC } from './components/LXC';
import { Log } from './components/Log';
import { Moon } from './components/Moon';
import { Notification } from './components/Notification';
import { Official } from './components/Official';
import { Offline } from './components/Offline';
import { OpenApp } from './components/OpenApp';
import { Parameter } from './components/Parameter';
import { Pause } from './components/Pause';
import { Praise } from './components/Praise';
import { ReportFeedback } from './components/ReportFeedback';
import { Reset } from './components/Reset';
import { Restart } from './components/Restart';
import { Rocket } from './components/Rocket';
import { Run } from './components/Run';
import { Save } from './components/Save';
import { Scale } from './components/Scale';
import { Script } from './components/Script';
import { Search } from './components/Search';
import { Send } from './components/Send';
import { Settings } from './components/Settings';
import { Shop } from './components/Shop';
import { Star } from './components/Star';
import { Stop } from './components/Stop';
import { Sun } from './components/Sun';
import { Suspend } from './components/Suspend';
import { ThemeAuto } from './components/ThemeAuto';
import { ThemeDark } from './components/ThemeDark';
import { ThemeLight } from './components/ThemeLight';
import { Trash } from './components/Trash';
import { UX } from './components/UX';
import { User } from './components/User';
import { Users } from './components/Users';
import { Verified } from './components/Verified';
import { ViewGrid } from './components/ViewGrid';
import { ViewRows } from './components/ViewRows';
import { Library } from './components/Library';
import { Host } from './components/Host';
import { VirtualMachine } from './components/VirtualMachine';
import { Role } from './components/Role';
import { Roles } from './components/Roles';
import { Cache } from './components/Cache';
import { Claim } from './components/Claim';
import { Claims } from './components/Claims';
import { KeyManagement } from './components/KeyManagement';
import { Windows } from './components/Windows';
import { Ubuntu } from './components/Ubuntu';
import { Debian } from './components/Debian';
import { Apple } from './components/Apple';
import { KaliLinux } from './components/KaliLinux';
import { RedHat } from './components/RedHat';
import { Fedora } from './components/Fedora';
import { CentOS } from './components/CentOS';
import { Clone } from './components/Clone';
import { Copy } from './components/Copy';
import { Live } from './components/Live';
import { HealthCheck } from './components/HealthCheck';
import { ReverseProxy } from './components/ReverseProxy';
import { ReverseProxyRoutes } from './components/ReverseProxyRoutes';
import { ReverseProxyCORS } from './components/ReverseProxyCORS';
import { ReverseProxyFrom } from './components/ReverseProxyFrom';
import { ReverseProxyHeadersRequest } from './components/ReverseProxyHeadersRequest';
import { ReverseProxyHeadersResponse } from './components/ReverseProxyHeadersResponse';
import { ReverseProxyHTTP } from './components/ReverseProxyHTTP';
import { ReverseProxyTLS } from './components/ReverseProxyTLS';
import { ReverseProxyTo } from './components/ReverseProxyTo';
import { ReverseProxyTCP } from './components/ReverseProxyTCP';
import { Refresh } from './components/Refresh';
import { Calendar } from './components/Calendar';
import { Folder } from './components/Folder';
import { Jobs } from './components/Jobs';
import { Warning } from './components/Warning';
import { Artifactory } from './components/Artifactory';
import { Azure } from './components/Azure';
import { Minio } from './components/Minio';
import { Aws } from './components/Aws';
import { Orchestrator } from './components/Orchestrator';
import { Podman } from './components/Podman';
import { PodmanDesktop } from './components/PodmanDesktop';
import { Group } from './components/Group';
import { Pin } from './components/Pin';
import { Database } from './components/Database';
import { RemoteHost } from './components/RemoteHost';
import { Login } from './components/Login';
import { Logout } from './components/Logout';
import { Snapshot } from './components/Snapshot';
import { Revert } from './components/Revert'

export type IconName =
  | 'Add'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'Attached'
  | 'Attachment'
  | 'Back'
  | 'Blueprint'
  | 'Bug'
  | 'Chat'
  | 'CheckCircle'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'Clean'
  | 'Close'
  | 'Close1'
  | 'CloudOff'
  | 'Cog'
  | 'Complete'
  | 'Container'
  | 'CopyClipboard'
  | 'Dashboard'
  | 'Details'
  | 'Docker copy'
  | 'Docker'
  | 'Dots'
  | 'Download'
  | 'Edit'
  | 'Equal'
  | 'Error'
  | 'Export'
  | 'EyeClosed'
  | 'EyeOpen'
  | 'Globe'
  | 'Help'
  | 'Idea'
  | 'Image'
  | 'Info'
  | 'Key'
  | 'LXC-Old'
  | 'LXC'
  | 'Log'
  | 'Moon'
  | 'Notification'
  | 'Official'
  | 'Offline'
  | 'OpenApp'
  | 'Parameter'
  | 'Pause'
  | 'Praise'
  | 'ReportFeedback'
  | 'Reset'
  | 'Restart'
  | 'Rocket'
  | 'Run'
  | 'Save'
  | 'Scale'
  | 'Script'
  | 'Search'
  | 'Send'
  | 'Settings'
  | 'Shop'
  | 'Star'
  | 'Stop'
  | 'Sun'
  | 'Suspend'
  | 'ThemeAuto'
  | 'ThemeDark'
  | 'ThemeLight'
  | 'Trash'
  | 'UX'
  | 'User'
  | 'Users'
  | 'Verified'
  | 'ViewGrid'
  | 'ViewRows'
  | 'Library'
  | 'Host'
  | 'VirtualMachine'
  | 'Role'
  | 'Roles'
  | 'Cache'
  | 'Claim'
  | 'Claims'
  | 'KeyManagement'
  | 'Windows'
  | 'Ubuntu'
  | 'Debian'
  | 'Apple'
  | 'KaliLinux'
  | 'RedHat'
  | 'Fedora'
  | 'CentOS'
  | 'Clone'
  | 'Copy'
  | 'Live'
  | 'HealthCheck'
  | 'ReverseProxy'
  | 'ReverseProxyCORS'
  | 'ReverseProxyRoutes'
  | 'ReverseProxyFrom'
  | 'ReverseProxyHeadersRequest'
  | 'ReverseProxyHeadersResponse'
  | 'ReverseProxyHTTP'
  | 'ReverseProxyTo'
  | 'ReverseProxyTLS'
  | 'ReverseProxyTCP'
  | 'Refresh'
  | 'Calendar'
  | 'Folder'
  | 'Jobs'
  | 'Warning'
  | 'Artifactory'
  | 'Azure'
  | 'Minio'
  | 'Aws'
  | 'Orchestrator'
  | 'Podman'
  | 'PodmanDesktop'
  | 'Group'
  | 'Pin'
  | 'Database'
  | 'RemoteHost'
  | 'Login'
  | 'Logout'
  | 'Snapshot'
  | 'Revert';

export const iconRegistry: Record<IconName, React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>> = {
  Add: Add,
  ArrowDown: ArrowDown,
  ArrowLeft: ArrowLeft,
  ArrowRight: ArrowRight,
  ArrowUp: ArrowUp,
  Attached: Attached,
  Attachment: Attachment,
  Back: Back,
  Blueprint: Blueprint,
  Bug: Bug,
  Chat: Chat,
  CheckCircle: CheckCircle,
  ChevronLeft: ChevronLeft,
  ChevronRight: ChevronRight,
  Clean: Clean,
  Close: Close,
  Close1: Close1,
  CloudOff: CloudOff,
  Cog: Cog,
  Complete: Complete,
  Container: Container,
  CopyClipboard: CopyClipboard,
  Dashboard: Dashboard,
  Details: Details,
  'Docker copy': DockerCopy,
  Docker: Docker,
  Dots: Dots,
  Download: Download,
  Edit: Edit,
  Equal: Equal,
  Error: Error,
  Export: Export,
  EyeClosed: EyeClosed,
  EyeOpen: EyeOpen,
  Globe: Globe,
  Help: Help,
  Idea: Idea,
  Image: Image,
  Info: Info,
  Key: Key,
  'LXC-Old': LXCOld,
  LXC: LXC,
  Log: Log,
  Moon: Moon,
  Notification: Notification,
  Official: Official,
  Offline: Offline,
  OpenApp: OpenApp,
  Parameter: Parameter,
  Pause: Pause,
  Praise: Praise,
  ReportFeedback: ReportFeedback,
  Reset: Reset,
  Restart: Restart,
  Rocket: Rocket,
  Run: Run,
  Save: Save,
  Scale: Scale,
  Script: Script,
  Search: Search,
  Send: Send,
  Settings: Settings,
  Shop: Shop,
  Star: Star,
  Stop: Stop,
  Sun: Sun,
  Suspend: Suspend,
  ThemeAuto: ThemeAuto,
  ThemeDark: ThemeDark,
  ThemeLight: ThemeLight,
  Trash: Trash,
  UX: UX,
  User: User,
  Users: Users,
  Verified: Verified,
  ViewGrid: ViewGrid,
  ViewRows: ViewRows,
  Library: Library,
  Host: Host,
  VirtualMachine: VirtualMachine,
  Role: Role,
  Roles: Roles,
  Cache: Cache,
  Claim: Claim,
  Claims: Claims,
  KeyManagement: KeyManagement,
  Windows: Windows,
  Ubuntu: Ubuntu,
  Debian: Debian,
  Apple: Apple,
  KaliLinux: KaliLinux,
  RedHat: RedHat,
  Fedora: Fedora,
  CentOS: CentOS,
  Clone: Clone,
  Copy: Copy,
  Live: Live,
  HealthCheck: HealthCheck,
  ReverseProxy: ReverseProxy,
  ReverseProxyCORS: ReverseProxyCORS,
  ReverseProxyRoutes: ReverseProxyRoutes,
  ReverseProxyFrom: ReverseProxyFrom,
  ReverseProxyHeadersRequest: ReverseProxyHeadersRequest,
  ReverseProxyHeadersResponse: ReverseProxyHeadersResponse,
  ReverseProxyHTTP: ReverseProxyHTTP,
  ReverseProxyTo: ReverseProxyTo,
  ReverseProxyTLS: ReverseProxyTLS,
  ReverseProxyTCP: ReverseProxyTCP,
  Refresh: Refresh,
  Calendar: Calendar,
  Folder: Folder,
  Jobs: Jobs,
  Warning: Warning,
  Artifactory: Artifactory,
  Azure: Azure,
  Minio: Minio,
  Aws: Aws,
  Orchestrator: Orchestrator,
  Podman: Podman,
  PodmanDesktop: PodmanDesktop,
  Group: Group,
  Pin: Pin,
  Database: Database,
  RemoteHost: RemoteHost,
  Login: Login,
  Logout: Logout,
  Snapshot: Snapshot,
  Revert: Revert,
};
